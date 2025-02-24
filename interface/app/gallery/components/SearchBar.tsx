import React from 'react';
import { FaSearch } from 'react-icons/fa';

interface SearchBarProps {
    query: string;
    setQuery: (query: string) => void;
    onSearch: () => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ query, setQuery, onSearch }) => {
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        onSearch();
    };

    return (
        <form onSubmit={handleSearch} className="flex justify-center">
            <div className="relative w-[80%] max-w-3xl">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-neutral-400">
                    <FaSearch />
                </span>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search Solutions"
                    className="w-full pl-12 pr-4 py-3 text-lg border border-neutral-700 rounded-lg bg-neutral-800 text-neutral-100 outline-none shadow focus:ring focus:ring-neutral-700 focus:border-neutral-500 transition-all duration-300"
                />
            </div>
        </form>
    );
};

export default SearchBar;