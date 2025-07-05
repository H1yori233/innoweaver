import os
import signal
import psutil
import time

def find_server_process():
    """查找运行在 5000 端口的进程"""
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            # 使用 net_connections() 替代已废弃的 connections()
            connections = psutil.net_connections()
            for conn in connections:
                if conn.laddr and conn.laddr.port == 5000 and conn.pid:
                    return psutil.Process(conn.pid)
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue
    return None

def shutdown_server():
    print("正在查找服务器进程...")
    server_process = find_server_process()
    
    if not server_process:
        print("未找到运行在 5000 端口的服务器进程")
        return
    
    parent_pid = server_process.pid
    print(f"找到主进程 PID: {parent_pid}")
    
    # 获取所有子进程
    try:
        parent = psutil.Process(parent_pid)
        children = parent.children(recursive=True)
        
        # 先发送 SIGTERM 信号
        print("正在发送终止信号...")
        for child in children:
            try:
                os.kill(child.pid, signal.SIGTERM)
            except (ProcessLookupError, psutil.NoSuchProcess):
                pass
        
        try:
            os.kill(parent_pid, signal.SIGTERM)
        except (ProcessLookupError, psutil.NoSuchProcess):
            pass
        
        # 等待进程结束
        time.sleep(2)
        
        # 如果进程还在运行，强制结束
        if psutil.pid_exists(parent_pid):
            print("正在强制结束进程...")
            for child in children:
                try:
                    os.kill(child.pid, signal.SIGKILL)
                except (ProcessLookupError, psutil.NoSuchProcess):
                    pass
            try:
                os.kill(parent_pid, signal.SIGKILL)
            except (ProcessLookupError, psutil.NoSuchProcess):
                pass
        
        print("服务器已关闭")
    except psutil.NoSuchProcess:
        print("进程已经不存在")
    except Exception as e:
        print(f"关闭服务器时发生错误: {e}")

if __name__ == "__main__":
    shutdown_server()