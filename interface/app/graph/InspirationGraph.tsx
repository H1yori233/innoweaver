/**
 * InspirationGraph.tsx
 * 基于3D力导向图的灵感关系可视化组件
 * 支持百万级数据点的高性能渲染
 */

import 'aframe';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import dynamic from 'next/dynamic';
import SpriteText from 'three-spritetext';
import { TagResult } from './TagExtractor';
import { useTheme } from 'next-themes';
import { FaExpand, FaCompress, FaGlasses, FaProjectDiagram } from 'react-icons/fa';
import * as d3 from 'd3-force';
import { debounce } from 'lodash';

import { ForceGraphMethods, LinkObject, NodeObject } from 'react-force-graph-3d';

// Dynamically import ForceGraph3D to ensure it only runs on the client side
const ForceGraph3D = dynamic(() => import('react-force-graph-3d'), {
  ssr: false,
  loading: () => <p className="text-center text-gray-500">Loading 3D Graph...</p> // Optional: Add a loading indicator
});

const ForceGraph2D = dynamic(() => import('react-force-graph').then(mod => {
  const ForceGraph = mod.ForceGraph2D;
  const ForceGraph2DWrapper = (props: any) => <ForceGraph {...props} />;
  ForceGraph2DWrapper.displayName = 'ForceGraph2DWrapper';
  return ForceGraph2DWrapper;
}), { 
  ssr: false 
});

// Simplify LOD level constants, only distinguish whether to show Title
const LOD_LEVELS = {
  NONE: 'NONE',      // Don't show any text
  TITLE: 'TITLE'     // Only show node titles
} as const;

type LODLevel = typeof LOD_LEVELS[keyof typeof LOD_LEVELS];

interface GraphNode {
  id: string;
  name: string;
  group: string;
  val: number;
  color?: string;
  type: 'inspiration' | 'tag';
}

interface GraphLink {
  source: string;
  target: string;
  value: number;
}

interface GraphData {
  nodes: GraphNode[];
  links: GraphLink[];
}

interface InspirationGraphProps {
  tagResults: TagResult[];
  selectedTags: string[];
  toggleTag: (tag: string) => void;
  onNodeClick?: (node: GraphNode) => void;
}

const InspirationGraph: React.FC<InspirationGraphProps> = ({
  tagResults,
  selectedTags,
  toggleTag,
  onNodeClick
}) => {
  const graphRef = useRef<any>();
  const containerRef = useRef<HTMLDivElement>(null);
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [is3D, setIs3D] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [nodeCount, setNodeCount] = useState(0);
  const [linkCount, setLinkCount] = useState(0);
  const [currentLodLevel, setCurrentLodLevel] = useState<LODLevel>(LOD_LEVELS.NONE);
  const { theme } = useTheme();
  
  // 构建图数据
  const buildGraphData = useCallback(() => {
    if (!tagResults.length) return { nodes: [], links: [] };
    
    setLoading(true);
    
    try {
      // 在客户端创建Worker
      let worker: Worker;
      
      if (typeof window !== 'undefined') {
        // 创建Worker字符串
        const workerCode = `
          // Web Worker代码
          self.addEventListener('message', (event) => {
            const { tagResults, selectedTags, threshold } = event.data;
            
            // 构建图数据
            const { nodes, links } = buildGraphData(tagResults, selectedTags, threshold);
            
            // 发送结果回主线程
            self.postMessage({ nodes, links });
          });
          
          function buildGraphData(tagResults, selectedTags, threshold) {
            // 创建节点和链接集合
            const nodes = [];
            const links = [];
            
            // 创建唯一ID映射
            const nodeMap = new Map();
            const inspirationTagMap = new Map(); // 存储每个灵感的标签集合
            
            // 需要采样的大数据集
            const needsSampling = tagResults.length > threshold;
            
            // 计算标签频率 (可能仍然需要用于过滤或加权)
            const tagFrequency = new Map();
            const allTags = new Set();
            tagResults.forEach(result => {
              result.tags.forEach(tag => {
                allTags.add(tag);
                tagFrequency.set(tag, (tagFrequency.get(tag) || 0) + 1);
              });
            });
            
            let filteredResults = tagResults;
            let relevantTags = allTags; // 开始时使用所有标签
            
            if (needsSampling) {
              // 基于频率过滤标签 (可选，但可以减少后续计算量)
              const sortedTags = Array.from(allTags).sort((a, b) => 
                (tagFrequency.get(b) || 0) - (tagFrequency.get(a) || 0)
              ).slice(0, 500); // 限制考虑的标签数量
              relevantTags = new Set(sortedTags);
              
              // 基于相关性过滤灵感 (确保选中的标签和高频标签相关的灵感被包含)
              filteredResults = tagResults.filter(result => 
                result.tags.some(tag => relevantTags.has(tag)) || 
                selectedTags.some(tag => result.tags.includes(tag))
              );
              
              // 如果仍然太多，则基于重要性采样
              if (filteredResults.length > threshold / 5) { // 调整采样阈值
                const scoredResults = filteredResults.map(result => {
                  const score = result.tags.filter(tag => 
                    relevantTags.has(tag) || selectedTags.includes(tag)
                  ).length;
                  return { result, score };
                });
                
                filteredResults = scoredResults
                  .sort((a, b) => b.score - a.score)
                  .slice(0, threshold / 5) // 调整采样数量
                  .map(item => item.result);
              }
            }
            
            // --- 只创建灵感节点 --- 
            filteredResults.forEach(result => {
              const inspirationNodeId = 'insp-' + result.inspirationId; // 使用字符串拼接
              const inspirationNode = {
                id: inspirationNodeId,
                name: result.title.length > 20 ? result.title.substring(0, 20) + '...' : result.title,
                group: 'inspiration', // 只有一个组
                val: 3, // 增大节点大小 (之前是 2)
                type: 'inspiration'
              };
              
              nodes.push(inspirationNode);
              nodeMap.set(inspirationNode.id, inspirationNode);
              
              // 存储该灵感的标签集合，用于后续链接计算
              inspirationTagMap.set(inspirationNode.id, new Set(result.tags));
            });

            // --- 根据共享标签创建灵感节点之间的链接 --- 
            const potentialLinks = []; // 存储所有可能的链接及其权重
            const inspirationNodeIds = Array.from(nodeMap.keys());
            
            for (let i = 0; i < inspirationNodeIds.length; i++) {
              for (let j = i + 1; j < inspirationNodeIds.length; j++) {
                const idA = inspirationNodeIds[i];
                const idB = inspirationNodeIds[j];
                
                const tagsA = inspirationTagMap.get(idA);
                const tagsB = inspirationTagMap.get(idB);
                
                if (tagsA && tagsB) {
                  const sharedTags = new Set([...tagsA].filter(tag => tagsB.has(tag)));
                  
                  if (sharedTags.size > 0) {
                    // 存储潜在链接和权重
                    potentialLinks.push({
                      source: idA,
                      target: idB,
                      value: sharedTags.size
                    });
                  }
                }
              }
            }
            
            // --- 限制每个节点的链接数量为最多 3 个 --- 
            const nodeLinks = new Map(); // Map<nodeId, Array<{ target: nodeId, value: number }>>
            potentialLinks.forEach(link => {
              // 为 source 添加链接
              if (!nodeLinks.has(link.source)) nodeLinks.set(link.source, []);
              nodeLinks.get(link.source).push({ target: link.target, value: link.value });
              // 为 target 添加链接 (因为关系是双向的)
              if (!nodeLinks.has(link.target)) nodeLinks.set(link.target, []);
              nodeLinks.get(link.target).push({ target: link.source, value: link.value }); 
            });
            
            const finalLinks = [];
            const addedLinks = new Set(); // 用于防止重复添加链接 (e.g., A->B 和 B->A)
            
            nodeLinks.forEach((linksList, nodeId) => {
              // 按权重降序排序
              linksList.sort((a, b) => b.value - a.value);
              
              // 取前 3 个链接
              const topLinks = linksList.slice(0, 3);
              
              topLinks.forEach(link => {
                // 创建唯一的链接标识符 (排序节点 ID)
                const linkId = [nodeId, link.target].sort().join('--');
                if (!addedLinks.has(linkId)) {
                  finalLinks.push({
                    source: nodeId,
                    target: link.target,
                    value: link.value
                  });
                  addedLinks.add(linkId);
                }
              });
            });
            
            // 返回节点和过滤后的链接
            return { nodes, links: finalLinks };
          }
        `;
        
        // 创建Blob并转换为URL
        const blob = new Blob([workerCode], { type: 'application/javascript' });
        const workerUrl = URL.createObjectURL(blob);
        
        // 创建Worker
        worker = new Worker(workerUrl);
        
        // 处理返回的数据
        worker.onmessage = (e) => {
          const { nodes, links } = e.data;
          setGraphData({ nodes, links });
          setNodeCount(nodes.length);
          setLinkCount(links.length);
          setLoading(false);
          
          // 清理URL
          URL.revokeObjectURL(workerUrl);
        };
        
        // 发送数据给Worker
        worker.postMessage({
          tagResults,
          selectedTags,
          threshold: 100000
        });
        
        // 清理函数
        return () => {
          worker.terminate();
          URL.revokeObjectURL(workerUrl);
        };
      } else {
        // 服务器端渲染时不处理
        setLoading(false);
        return undefined;
      }
    } catch (error) {
      console.error("Worker creation error:", error);
      setLoading(false);
      
      // 在出错时使用主线程处理（降级方案）
      const processDataInMainThread = () => {
        // 简化的处理逻辑，只提取最常见的标签
        const nodes: GraphNode[] = [];
        const links: GraphLink[] = [];
        const tagSet = new Set<string>();
        const inspirationTagMap = new Map<string, Set<string>>(); // 用于主线程逻辑
        
        // 只处理少量数据
        const limitedResults = tagResults.slice(0, 100);
        
        // --- 主线程：创建灵感节点 --- 
        limitedResults.forEach(result => {
          const nodeId = 'insp-' + result.inspirationId; // 使用字符串拼接
          nodes.push({
            id: nodeId,
            name: result.title.substring(0, 20),
            group: 'inspiration',
            val: 3, // 增大节点大小 (之前是 1)
            type: 'inspiration'
          });
          // 存储标签用于链接计算
          inspirationTagMap.set(nodeId, new Set(result.tags)); 
        });

        // --- 主线程：根据共享标签创建链接 (并限制数量) --- 
        const potentialLinksMain = [];
        const inspirationNodeIdsMain = nodes.map(n => n.id);
        for (let i = 0; i < inspirationNodeIdsMain.length; i++) {
          for (let j = i + 1; j < inspirationNodeIdsMain.length; j++) {
            const idA = inspirationNodeIdsMain[i];
            const idB = inspirationNodeIdsMain[j];
            const tagsA = inspirationTagMap.get(idA);
            const tagsB = inspirationTagMap.get(idB);

            if (tagsA && tagsB) {
              const sharedTags = new Set([...tagsA].filter(tag => tagsB.has(tag)));
              if (sharedTags.size > 0) {
                potentialLinksMain.push({
                  source: idA,
                  target: idB,
                  value: sharedTags.size
                });
              }
            }
          }
        }

        const nodeLinksMain = new Map();
        potentialLinksMain.forEach(link => {
          if (!nodeLinksMain.has(link.source)) nodeLinksMain.set(link.source, []);
          nodeLinksMain.get(link.source).push({ target: link.target, value: link.value });
          if (!nodeLinksMain.has(link.target)) nodeLinksMain.set(link.target, []);
          nodeLinksMain.get(link.target).push({ target: link.source, value: link.value });
        });

        const finalLinksMain: GraphLink[] = [];
        const addedLinksMain = new Set();
        nodeLinksMain.forEach((linksList, nodeId) => {
          linksList.sort((a, b) => b.value - a.value);
          const topLinks = linksList.slice(0, 3);
          topLinks.forEach(link => {
            const linkId = [nodeId, link.target].sort().join('--');
            if (!addedLinksMain.has(linkId)) {
              finalLinksMain.push({
                source: nodeId,
                target: link.target,
                value: link.value
              });
              addedLinksMain.add(linkId);
            }
          });
        });

        setGraphData({ nodes, links: finalLinksMain });
        setNodeCount(nodes.length);
        setLinkCount(finalLinksMain.length); // 使用最终链接数量
      };
      
      processDataInMainThread();
    }
  }, [tagResults, selectedTags]);
  
  // 初始化图数据
  useEffect(() => {
    buildGraphData();
  }, [buildGraphData]);
  
  // 处理全屏模式
  const toggleFullscreen = () => {
    setFullscreen(!fullscreen);
  };
  
  // 切换2D/3D模式
  const toggle3DMode = () => {
    setIs3D(!is3D);
  };
  
  // LOD control - listen to zoom events
  useEffect(() => {
    if (graphRef.current) {
      const handleZoom = (zoom: number) => {
        console.log('Zoom level:', zoom); // Debug log
        // Show titles when zoomed in enough
        const newLodLevel = zoom > 5.0 ? LOD_LEVELS.TITLE : LOD_LEVELS.NONE;
        console.log('Setting LOD level to:', newLodLevel); // Debug log
        setCurrentLodLevel(newLodLevel);
      };
      
      // Register zoom event for 2D graph
      if (!is3D && graphRef.current.zoom) {
        const zoomHandler = debounce((transform: any) => {
          console.log('2D zoom transform:', transform); // Debug log
          handleZoom(transform.k);
        }, 100);
        
        graphRef.current.zoom().on('zoom', zoomHandler);
      }
      
      // Register camera distance change event for 3D graph
      if (is3D && graphRef.current.cameraPosition) {
        const distanceHandler = debounce((position: any) => {
          // Calculate camera distance from center
          const distance = Math.sqrt(
            position.x * position.x +
            position.y * position.y +
            position.z * position.z
          );
          
          console.log('3D camera distance:', distance); // Debug log
          // Show titles when camera is close enough
          const threshold = 500; // Further reduced threshold for 3D view
          const newLodLevel = distance < threshold ? LOD_LEVELS.TITLE : LOD_LEVELS.NONE;
          console.log('Setting LOD level to:', newLodLevel); // Debug log
          setCurrentLodLevel(newLodLevel);
        }, 100);
        
        // Listen to camera position
        let prevCameraPos = { x: 0, y: 0, z: 0 };
        const checkCameraChange = () => {
          const pos = graphRef.current.cameraPosition();
          if (
            pos.x !== prevCameraPos.x ||
            pos.y !== prevCameraPos.y ||
            pos.z !== prevCameraPos.z
          ) {
            prevCameraPos = { ...pos };
            distanceHandler(pos);
          }
          
          if (graphRef.current) {
            requestAnimationFrame(checkCameraChange);
          }
        };
        
        checkCameraChange();
      }
    }
  }, [is3D, graphRef.current]);
  
  // Graph configuration
  const graphConfig = {
    nodeAutoColorBy: 'group',
    nodeVal: (node: GraphNode) => node.val,
    nodeLabel: (node: GraphNode) => {
      console.log('Rendering node label, LOD level:', currentLodLevel); // Debug log
      return currentLodLevel === LOD_LEVELS.TITLE ? node.name : null;
    },
    linkWidth: 0.3,
    linkDirectionalParticles: 0,
    linkDirectionalParticleWidth: 0.5,
    d3AlphaDecay: 0.01,
    d3VelocityDecay: 0.08,
    warmupTicks: 100,
    cooldownTicks: 1000,
    onNodeClick: (node: GraphNode) => {
      if (node.type === 'inspiration') {
        // Extract inspirationId from node.id (e.g., 'insp-123')
        const inspirationId = node.id.startsWith('insp-') ? node.id.substring(5) : null;
        if (inspirationId && typeof window !== 'undefined') {
          window.open(`/inspiration/${inspirationId}`, '_blank');
        }
      } else if (node.type === 'tag') {
        // Use node.name as the tag
        const tagName = node.name;
        if (tagName && typeof window !== 'undefined') {
          window.open(`/search?tag=${encodeURIComponent(tagName)}`, '_blank');
        }
      }
      // Removed toggleTag and external onNodeClick call to prioritize navigation
    },
    nodeThreeObject: is3D ? (node: GraphNode) => {
      console.log('Rendering 3D node, LOD level:', currentLodLevel); // Debug log
      if (currentLodLevel !== LOD_LEVELS.TITLE) return null;
      
      const sprite = new SpriteText(node.name);
      sprite.color = '#ffffff';
      sprite.textHeight = node.val * 0.72; // 根据节点大小调整文字高度
      sprite.backgroundColor = 'rgba(0, 0, 0, 0.6)';
      sprite.padding = 1; // 减小padding
      sprite.borderRadius = 2;
      return sprite;
    } : undefined
  };
  
  // 性能优化：暂停渲染当不在视口中
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (graphRef.current) {
          if (entry.isIntersecting) {
            graphRef.current.resumeAnimation();
          } else {
            graphRef.current.pauseAnimation();
          }
        }
      },
      { threshold: 0.1 }
    );
    
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => {
      if (containerRef.current) {
        observer.unobserve(containerRef.current);
      }
    };
  }, []);
  
  // 动态调整力导向参数
  useEffect(() => {
    if (graphRef.current) {
      // 根据节点数动态调整力导向参数
      const fg = graphRef.current;
      if (nodeCount > 1000) {
        fg.d3Force('charge', d3.forceManyBody().strength(-10));
        fg.d3Force('link', d3.forceLink().distance(30));
      } else {
        fg.d3Force('charge', d3.forceManyBody().strength(-30));
        fg.d3Force('link', d3.forceLink().distance(50));
      }
    }
  }, [nodeCount, graphRef.current]);

  // 渲染图形
  return (
    <div 
      ref={containerRef}
      className={`relative border border-border-primary rounded-md overflow-hidden bg-primary
        ${fullscreen ? 'fixed top-0 left-0 right-0 bottom-0 z-50' : 'h-[750px]'}`}
    >
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center bg-primary bg-opacity-75 z-10">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-t-blue-500 border-r-transparent border-b-blue-500 border-l-transparent"></div>
            <p className="mt-2 text-text-primary">Building Relationship Graph...</p>
          </div>
        </div>
      ) : (
        <>
          <div className="absolute top-4 right-4 z-10 flex space-x-2">
            <button
              onClick={toggle3DMode}
              className="p-2 bg-secondary rounded-md hover:bg-border-primary text-text-primary"
              title={is3D ? "Switch to 2D View" : "Switch to 3D View"}
            >
              {is3D ? <FaProjectDiagram /> : <FaGlasses />}
            </button>
            <button
              onClick={toggleFullscreen}
              className="p-2 bg-secondary rounded-md hover:bg-border-primary text-text-primary"
              title={fullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {fullscreen ? <FaCompress /> : <FaExpand />}
            </button>
          </div>
          
          <div className="absolute bottom-4 left-4 z-10 bg-secondary p-2 rounded-md text-xs text-text-secondary">
            {nodeCount} Nodes | {linkCount} Links
          </div>
          
          {is3D ? (
            <ForceGraph3D
              graphData={graphData}
              backgroundColor={theme === 'dark' ? '#1a1a1a' : '#ffffff'}
              {...graphConfig}
              ref={graphRef}
            />
          ) : (
            <ForceGraph2D
              graphData={graphData}
              nodeCanvasObject={(node, ctx, globalScale) => {
                // Draw node background
                const nodeSize = node.val || 5;
                
                // --- Restore Node Drawing --- 
                ctx.beginPath();
                ctx.arc(node.x ?? 0, node.y ?? 0, nodeSize, 0, 2 * Math.PI, false); // Added nullish coalescing for x, y
                // Use color assigned by nodeAutoColorBy, or a default
                ctx.fillStyle = node.color || 'rgba(100, 100, 100, 0.8)'; 
                ctx.fill();
                // --- End Restore Node Drawing --- 

                // Calculate node's screen space size (still needed for label visibility check)
                const screenSize = nodeSize * globalScale;
                
                // Draw label based on node size and zoom level
                if (screenSize > 10 && globalScale > 2.5) { // Adjusted thresholds slightly
                  const label = node.name;
                  const fontSize = Math.min(nodeSize * 1.2, Math.max(8, Math.floor(globalScale * 1.8))); // Slightly adjusted font scaling
                  
                  ctx.font = `${fontSize}px Sans-Serif`;
                  const textWidth = ctx.measureText(label).width;
                  const backgroundPadding = 2; // Reduced padding
                  const bckgDimensions = [textWidth + backgroundPadding * 2, fontSize + backgroundPadding * 2]; 
                  
                  // --- Modified Label Position Calculation --- 
                  // Position label closer to the node top
                  const labelOffsetY = nodeSize + 4; // Offset from node center (radius + 4px)
                  const labelY = node.y - labelOffsetY; 

                  ctx.fillStyle = 'rgba(0, 0, 0, 0.7)'; // Background color
                  // Adjust background position based on textBaseline = 'bottom'
                  ctx.fillRect(
                    node.x - bckgDimensions[0] / 2, // Center horizontally
                    labelY - bckgDimensions[1] + backgroundPadding, // Position background above text bottom
                    bckgDimensions[0],
                    bckgDimensions[1]
                  );
                  
                  ctx.textAlign = 'center';
                  ctx.textBaseline = 'bottom'; // Align text bottom to labelY
                  ctx.fillStyle = '#ffffff'; // Text color
                  ctx.fillText(label, node.x, labelY);
                }
              }}
              {...graphConfig}
              ref={graphRef}
            />
          )}
          
          {/* Simplified LOD indicator */}
          <div className="absolute bottom-4 right-4 z-10 bg-secondary p-2 rounded-md text-xs text-text-secondary">
            Display Mode: {currentLodLevel === LOD_LEVELS.TITLE ? 'Show Titles' : 'Icons Only'}
          </div>
        </>
      )}
    </div>
  );
};

export default InspirationGraph; 