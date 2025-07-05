// 6704ff66c0b008ebd5d78681

"use client";

import { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';

const Solution = () => {
    // const router = useRouter();
    const [id, setId] = useState('');
    useEffect(() => {
        const storedId = localStorage.getItem("id");

        if (storedId) {
            setId(storedId);
        }
    }, []);

    return (
        <div className='user_history_container'>
            <div className="my-24">
                favlist : {id}
            </div>
        </div>
    )
};

export default Solution;
