import os
import signal
import psutil
import time

def find_server_process():
    """Find process running on port 5000"""
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            # Use net_connections() instead of deprecated connections()
            connections = psutil.net_connections()
            for conn in connections:
                if conn.laddr and conn.laddr.port == 5000 and conn.pid:
                    return psutil.Process(conn.pid)
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue
    return None

def shutdown_server():
    print("Looking for server process...")
    server_process = find_server_process()
    
    if not server_process:
        print("No server process found running on port 5000")
        return
    
    parent_pid = server_process.pid
    print(f"Found main process PID: {parent_pid}")
    
    # Get all child processes
    try:
        parent = psutil.Process(parent_pid)
        children = parent.children(recursive=True)
        
        # Send SIGTERM signal first
        print("Sending termination signal...")
        for child in children:
            try:
                os.kill(child.pid, signal.SIGTERM)
            except (ProcessLookupError, psutil.NoSuchProcess):
                pass
        
        try:
            os.kill(parent_pid, signal.SIGTERM)
        except (ProcessLookupError, psutil.NoSuchProcess):
            pass
        
        # Wait for process to end
        time.sleep(2)
        
        # If process is still running, force termination
        if psutil.pid_exists(parent_pid):
            print("Force terminating process...")
            for child in children:
                try:
                    os.kill(child.pid, signal.SIGKILL)
                except (ProcessLookupError, psutil.NoSuchProcess):
                    pass
            try:
                os.kill(parent_pid, signal.SIGKILL)
            except (ProcessLookupError, psutil.NoSuchProcess):
                pass
        
        print("Server has been shut down")
    except psutil.NoSuchProcess:
        print("Process no longer exists")
    except Exception as e:
        print(f"Error occurred while shutting down server: {e}")

if __name__ == "__main__":
    shutdown_server() 