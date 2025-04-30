import { FaRedo } from 'react-icons/fa';

interface AnalysisResultProps {
  analysisResult: any;
  handleQueryAnalysis: () => void;
}

const AnalysisResult = ({ analysisResult, handleQueryAnalysis }: AnalysisResultProps) => {
  return (
    <div className="p-4 bg-secondary/50 rounded-lg text-sm font-normal relative">
      <button className="absolute top-2 right-2 cursor-pointer" onClick={handleQueryAnalysis}>
        <FaRedo className="text-text-secondary hover:text-gray-100 text-xl" />
      </button>

      <div className='overflow-auto'>
        <p>
          <span className="text-text-secondary font-bold">TARGET USER:</span>
          <span className="ml-2"> {analysisResult['Targeted User'] || 'N/A'} </span>
        </p>
        <br />

        <p>
          <span className="text-text-secondary font-bold">USAGE SCENARIO:</span>
          <span className="ml-2"> {analysisResult['Usage Scenario'] || 'N/A'} </span>
        </p>
        <br />

        <p>
          <span className="text-text-secondary0 font-bold">REQUIREMENTS:</span>
          <span className="ml-2">
            {Array.isArray(analysisResult['Requirement'])
              ? analysisResult['Requirement'].join(', ')
              : 'N/A'}
          </span>
        </p>
      </div>
    </div>
  );
};

export default AnalysisResult; 