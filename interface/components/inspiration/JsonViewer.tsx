// JsonViewer.tsx
import React, { useState } from "react";
import Link from "next/link";
import { FaCheck } from "react-icons/fa";
import { motion } from "framer-motion";

// JsonViewer 主组件
const JsonViewer = ({ 
  jsonData, 
  isSelectable = false,
  isSelected = false,
  onSelect = () => {}
}: { 
  jsonData: any, 
  isSelectable?: boolean,
  isSelected?: boolean,
  onSelect?: () => void 
}) => {
  const solutionData = jsonData.solution;
  const id = jsonData._id;

  if (!solutionData) {
    return <div> No solution data available. </div>;
  }

  return (
    <div
      className="bg-primary/80 border border-border-secondary p-4 
        w-full mx-auto rounded-2xl overflow-hidden"
      style={{ maxWidth: "1000px", fontFamily: "Arial, sans-serif" }}
    >
      <div>
        {Object.keys(solutionData).map((subKey) => {
          // 隐藏 image_url 和 image_name
          if (subKey === "image_url" || subKey === "image_name") {
            return null;
          }

          // 特殊处理 Title，添加选择按钮
          if (subKey === "Title") {
            return (
              <div key={subKey} className="flex items-center gap-2">
                {isSelectable && (
                  <motion.button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelect();
                    }}
                    className={`w-4 h-4 rounded-full flex items-center justify-center
                      border-2 ${
                        isSelected 
                          ? 'border-green-500 bg-green-500 text-white' 
                          : 'border-text-secondary bg-transparent hover:border-green-500 hover:bg-secondary/30'
                      }`}
                    title="Click to select"
                    whileTap={{ scale: 0.95 }}
                    animate={{
                      scale: isSelected ? 1.15 : 1,
                      transition: { type: "spring", stiffness: 400, damping: 25 }
                    }}
                  >
                    <motion.div
                      initial={false}
                      animate={{
                        scale: isSelected ? 1 : 0.5,
                        opacity: isSelected ? 1 : 0,
                        rotate: isSelected ? 0 : -90,
                      }}
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                        mass: 1
                      }}
                    >
                      <FaCheck className="text-base" />
                    </motion.div>
                  </motion.button>
                )}
                <Link
                  href={`/inspiration/${id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-blue-500 whitespace-nowrap no-underline hover:text-blue-700 
                      transition-colors duration-200 text-base"
                >
                  {solutionData[subKey]}:
                </Link>
              </div>
            );
          }

          // 特殊处理 "Technical Method" 和 "Possible Results"
          if (subKey === "Technical Method" || subKey === "Possible Results") {
            if (subKey === "Technical Method") {
              return (
                <TechnicalMethodSection
                  key="TechnicalMethod"
                  technicalMethod={solutionData["Technical Method"]}
                  possibleResults={solutionData["Possible Results"]}
                />
              );
            } else {
              return null;
            }
          }

          return <JsonNode key={subKey} keyName={subKey} value={solutionData[subKey]} />;
        })}
      </div>
    </div>
  );
};

// JsonNode 组件，支持展开/折叠
const JsonNode = ({
  keyName,
  value,
}: {
  keyName: string | number;
  value: any;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isExpandable = typeof value === "object" && value !== null;

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  // 判断是否是 Title 键
  const isTitle = keyName === "Title";

  // 判断是否是需要隐藏的字段
  const isHidden =
    keyName === "image_url" || keyName === "image_name";

  if (isHidden) {
    return null;
  }

  return (
    <div className="text-sm">
      {/* 节点标题 */}
      <div
        onClick={isExpandable ? toggleOpen : undefined}
        className={`flex items-center ${
          isExpandable ? "cursor-pointer" : ""
        }`}
      >
        {isExpandable && (
          <span className="cursor-pointer mr-1 select-none text-xs">
            {isOpen ? "▼" : "▶"}
          </span>
        )}
        {/* 如果是 Title，渲染为蓝色超链接 */}
        {isTitle ? (
          <Link
            href={`/solution/${encodeURIComponent(value)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-blue-500 whitespace-nowrap no-underline hover:text-blue-700 
                transition-colors duration-200 text-base"
          >
            {value}:
          </Link>
        ) : (
          <div className="font-bold text-text-primary whitespace-nowrap">
            {keyName}:
          </div>
        )}

        {/* 链接展示，仅适用于 _id 字段 */}
        {!isExpandable && keyName === "_id" && (
          <Link
            href={`/inspiration/${value}`}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-2 text-blue-500 no-underline hover:text-blue-700 transition-colors duration-200"
          >
            {value}
          </Link>
        )}

        {/* 普通值展示 */}
        {!isExpandable && keyName !== "_id" && !isTitle && (
          <div className="flex items-center ml-2.5">
            <span className="text-text-secondary inline-block whitespace-nowrap 
                overflow-hidden text-ellipsis cursor-pointer text-sm">
              {value}
            </span>
          </div>
        )}
      </div>

      {/* 子节点渲染 */}
      {isExpandable && isOpen && (
        <div className="ml-5">
          {Array.isArray(value)
            ? value.map((item, index) => (
                <JsonNode key={index} keyName={index} value={item} />
              ))
            : Object.keys(value).map((subKey) => {
                // 特殊处理 "Technical Method" 节点
                if (keyName === "Technical Method" && subKey !== "Original" && subKey !== "Iteration") {
                  return null;
                }

                return <JsonNode key={subKey} keyName={subKey} value={value[subKey]} />;
              })}
        </div>
      )}
    </div>
  );
};

// SolutionNode 组件，用于处理 solution 部分的特殊展示逻辑
const SolutionNode = ({
  keyName,
  value,
}: {
  keyName: string | number;
  value: any;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const isExpandable = typeof value === "object" && value !== null;

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  // 判断是否是需要隐藏的字段
  const isHidden =
    keyName === "image_url" || keyName === "image_name";

  if (isHidden) {
    return null;
  }

  return (
    <div className="ml-5 text-sm">
      {/* 节点标题 */}
      <div
        onClick={isExpandable ? toggleOpen : undefined}
        className={`flex items-center ${
          isExpandable ? "cursor-pointer" : ""
        }`}
      >
        {isExpandable && (
          <span className="cursor-pointer mr-1 select-none text-xs">
            {isOpen ? "▼" : "▶"}
          </span>
        )}
        <div className="font-bold text-text-primary whitespace-nowrap">
          {keyName}:
        </div>
      </div>

      {/* 子节点渲染 */}
      {isExpandable && isOpen && (
        <div className="ml-5">
          {Object.keys(value).map((subKey) => {
            // 隐藏 image_url 和 image_name
            if (subKey === "image_url" || subKey === "image_name") {
              return null;
            }

            // 特殊处理 "Technical Method" 和 "Possible Results"
            if (subKey === "Technical Method" || subKey === "Possible Results") {
              // 仅在处理 "Technical Method" 时合并内容
              if (subKey === "Technical Method") {
                return (
                  <TechnicalMethodSection
                    key="TechnicalMethod"
                    technicalMethod={value["Technical Method"]}
                    possibleResults={value["Possible Results"]}
                  />
                );
              } else {
                return null;
              }
            }

            return <JsonNode key={subKey} keyName={subKey} value={value[subKey]} />;
          })}
        </div>
      )}
    </div>
  );
};

// TechnicalMethodSection 组件，用于合并 "Technical Method" 和 "Possible Results"
const TechnicalMethodSection = ({
  technicalMethod,
  possibleResults,
}: {
  technicalMethod: any;
  possibleResults: any;
}) => {
  // 准备选项数据
  const options: {
    technicalMethod: string;
    performance: string;
    userExperience: string;
  }[] = [];

  // 添加 Original 选项
  if (
    technicalMethod?.Original &&
    possibleResults?.Original?.Performance &&
    possibleResults?.Original?.["User Experience"]
  ) {
    options.push({
      technicalMethod: technicalMethod.Original,
      performance: possibleResults.Original.Performance,
      userExperience: possibleResults.Original["User Experience"],
    });
  }

  // 添加 Iteration 选项
  if (
    technicalMethod?.Iteration &&
    possibleResults?.Iteration &&
    Array.isArray(technicalMethod.Iteration) &&
    Array.isArray(possibleResults.Iteration)
  ) {
    technicalMethod.Iteration.forEach((method: string, index: number) => {
      const result = possibleResults.Iteration[index];
      if (result) {
        options.push({
          technicalMethod: method,
          performance: result.Performance,
          userExperience: result["User Experience"],
        });
      }
    });
  }

  return (
    <div className="text-sm">
      {/* Technical Method 标题 */}
      <div className="flex items-center cursor-pointer" onClick={() => {}}>
        <span className="font-bold text-text-primary">Technical Method:</span>
      </div>

      {/* 选项列表 */}
      {options.map((option, index) => (
        <Option
          key={index}
          optionNumber={index + 1}
          technicalMethod={option.technicalMethod}
          performance={option.performance}
          userExperience={option.userExperience}
        />
      ))}
    </div>
  );
};

// Option 组件，用于展示每个选项的详细内容
const Option = ({
  optionNumber,
  technicalMethod,
  performance,
  userExperience,
}: {
  optionNumber: number;
  technicalMethod: string;
  performance: string;
  userExperience: string;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="ml-5">
      <div
        onClick={toggleOpen}
        className="flex items-center cursor-pointer"
        aria-expanded={isOpen}
      >
        <span className="cursor-pointer mr-1 select-none text-xs">
          {isOpen ? "▼" : "▶"}
        </span>
        <div className="font-bold text-text-primary whitespace-nowrap">
          Option {optionNumber}:
        </div>
      </div>
      {isOpen && (
        <div className="ml-5 mt-2">
          <div className="flex items-start mb-2">
            {/* <span className="font-bold text-text-primary">Technical Method: </span> */}
            <span>{technicalMethod}</span>
          </div>
          <div className="flex items-start mb-2">
            <span className="font-bold text-text-primary">Performance: </span>
            <span className="ml-2">{performance}</span>
          </div>
          <div className="flex items-start">
            <span className="font-bold text-text-primary">User Experience: </span>
            <span className="ml-2">{userExperience}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default JsonViewer;
