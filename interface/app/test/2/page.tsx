'use client';

import { useState, useEffect } from 'react';

export default function ApiTestPage() {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchData = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('http://localhost:5000/api/query_solution?id=67245d8394ffc23355f79716');
            if (!response.ok) {
                throw new Error(`API request failed with status ${response.status}`);
            }
            const result = await response.json();
            setData(result);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gray-50">
            <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-6">
                <h1 className="text-2xl font-medium text-gray-900 mb-4">API Test Page</h1>

                <button
                    onClick={fetchData}
                    className="w-full py-2 px-4 bg-blue-500 text-white font-medium rounded-md hover:bg-blue-600 transition-colors"
                >
                    Fetch Data
                </button>

                {loading && (
                    <div className="mt-4 text-center text-gray-600">
                        Loading...
                    </div>
                )}

                {error && (
                    <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-md">
                        {error}
                    </div>
                )}

                {data && (
                    <div className="mt-4">
                        <h2 className="text-lg font-medium text-gray-900 mb-2">Response:</h2>
                        <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto">
                            {JSON.stringify(data, null, 2)}
                        </pre>
                    </div>
                )}
            </div>
        </div>
    );
}
