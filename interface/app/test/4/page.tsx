"use client";

import React from 'react';
import { Bar } from 'react-chartjs-2';
import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';

// 注册 Chart.js 的模块
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const UserPage = ({ userData }: any) => {
  const { userQuery, keywords, authors, journals, topics } = userData;

  // 准备关键词的条形图数据
  const keywordsData = {
    labels: keywords.map((k: any) => k[0]), // 关键词列表
    datasets: [
      {
        label: 'Keyword Frequency',
        data: keywords.map((k: any) => k[1]), // 每个关键词的权重（例如，基于 TF-IDF）
        backgroundColor: '#4CAF50',
        borderColor: '#388E3C',
        borderWidth: 1
      }
    ]
  };

  // 准备作者的饼图数据
  const authorData = {
    labels: authors,
    datasets: [
      {
        data: authors.map((_: any, idx: number) => 1), // 每个作者出现一次，饼图数据
        backgroundColor: authors.map((_: any, idx: number) => `hsl(${(idx * 50) % 360}, 70%, 60%)`),
        borderColor: '#fff',
        borderWidth: 1
      }
    ]
  };

  // 准备期刊的饼图数据
  const journalData = {
    labels: journals,
    datasets: [
      {
        data: journals.map((_: any, idx: number) => 1), // 每个期刊出现一次，饼图数据
        backgroundColor: journals.map((_: any, idx: number) => `hsl(${(idx * 70) % 360}, 70%, 60%)`),
        borderColor: '#fff',
        borderWidth: 1
      }
    ]
  };

  // 准备兴趣话题的条形图数据
  const topicsData = {
    labels: topics.slice(0, 10), // 仅展示前10个兴趣话题
    datasets: [
      {
        label: 'Topic Frequency',
        data: topics.slice(0, 10).map((_: any, idx: number) => 1), // 每个话题出现一次，条形图数据
        backgroundColor: '#FF5722',
        borderColor: '#E64A19',
        borderWidth: 1
      }
    ]
  };

  return (
    <div className="flex flex-col items-center justify-center bg-primary min-h-screen p-8 ml-[12.5rem]">
      <h1 className="text-4xl font-bold text-text-primary mb-8">User Profile</h1>

      {/* User Query */}
      <section className="mb-12 w-full max-w-4xl">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">User Query</h2>
        <p className="text-text-secondary">{userQuery}</p>
      </section>

      {/* Keywords Bar Chart */}
      <section className="mb-12 w-full max-w-4xl">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Keywords</h2>
        <div className="w-full max-w-4xl h-96">
          <Bar data={keywordsData} options={{
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Top 10 Keywords',
              },
              legend: {
                display: false,
              },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Keywords',
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'TF-IDF Score',
                },
                beginAtZero: true,
              },
            }
          }} />
        </div>
      </section>

      {/* Authors Pie Chart */}
      <section className="mb-12 w-full max-w-4xl">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Authors</h2>
        <div className="w-full max-w-4xl h-96">
          <Pie data={authorData} options={{
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Author Distribution',
              },
              legend: {
                display: true,
              },
            }
          }} />
        </div>
      </section>

      {/* Journals Pie Chart */}
      <section className="mb-12 w-full max-w-4xl">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Journals</h2>
        <div className="w-full max-w-4xl h-96">
          <Pie data={journalData} options={{
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Journal Distribution',
              },
              legend: {
                display: true,
              },
            }
          }} />
        </div>
      </section>

      {/* Interest Topics Bar Chart */}
      <section className="mb-12 w-full max-w-4xl">
        <h2 className="text-2xl font-semibold text-text-primary mb-4">Interest Topics</h2>
        <div className="w-full max-w-4xl h-96">
          <Bar data={topicsData} options={{
            responsive: true,
            plugins: {
              title: {
                display: true,
                text: 'Top 10 Interest Topics',
              },
              legend: {
                display: false,
              },
            },
            scales: {
              x: {
                title: {
                  display: true,
                  text: 'Topics',
                },
              },
              y: {
                title: {
                  display: true,
                  text: 'Frequency',
                },
                beginAtZero: true,
              },
            }
          }} 
          style={{
            width: '100%', // 使图表宽度占满容器
            maxWidth: '800px', // 最大宽度
            height: '400px', // 设置高度
            margin: '0 auto', // 居中显示
            borderRadius: '10px', // 圆角
          }}
          />
        </div>
      </section>
    </div>
  );
};

export default UserPage;
