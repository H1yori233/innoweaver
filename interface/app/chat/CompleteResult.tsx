import { FaRedo } from 'react-icons/fa';
import MiniCard from '@/components/inspiration/MiniCard';

interface CompleteResultProps {
  completeResult: any;
  handleRegenerate: () => void;
}

const CompleteResult = ({ completeResult, handleRegenerate }: CompleteResultProps) => {
  return (
    <div className="flex flex-col text-sm font-normal p-4 gap-4 overflow-y-auto">
      <div className="flex justify-end">
        <button
          className="text-text-secondary hover:text-text-primary text-xl cursor-pointer"
          onClick={handleRegenerate}
        >
          <FaRedo />
        </button>
      </div>

      <div className="bg-primary px-6 py-2 rounded-lg shadow-md">
        <h2 className="text-lg font-semibold text-text-primary">
          {completeResult['title']}
        </h2>
        <p className="text-md text-text-secondary mt-4">
          {completeResult['desc']}
        </p>
      </div>

      <div className="p-1 rounded-lg
                    text-text-primary text-4xl font-bold
                    flex w-full h-auto items-center justify-center
                    gap-1 flex-wrap overflow-auto">

        {completeResult['solutions']?.length ? (
          completeResult['solutions'].map((solution, index) => (
            <div key={index}>
              <MiniCard
                key={index}
                content={solution}
                index={index}
                isLiked={false}
              />
            </div>
          ))
        ) : (
          <p className="text-base sm:text-lg text-text-placeholder">No inspirations available.</p>
        )}
      </div>
    </div>
  );
};

export default CompleteResult; 