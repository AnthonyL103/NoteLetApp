import { useState, useEffect } from 'react';
import ScanList from '../ScanList.js';
import { useUser } from '../UserContext';
import Authentication from '../Authentication';

const FilesPage = () => {
  const [scans, setScans] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [scanToDelete, setScanToDelete] = useState(null); 
  const { userId } = useUser();

  useEffect(() => {
    const fetchScans = async () => {
      try {
        const response = await fetch(`http://18.236.227.203:5001/displayscans?userId=${userId}`);;
        if (!response.ok) {
          throw new Error('Failed to fetch scans');
        }
        const data = await response.json();
        console.log('Fetched scans:', data);
        setScans(data);
      } catch (error) {
        console.error('Error fetching scans:', error);
      }
    };

    fetchScans();
  }, [userId]);
  
  const displayModal = (key) => {
    setScanToDelete(key); // Set the scan to delete
    //console.log(" reckey",key);
    setShowModal(true); // Show the modal
  };

  const handleCloseModal = () => {
    setShowModal(false); // Close the modal
    setScanToDelete(null); // Clear the scan to delete
  };

  const handleDeleteScan = async () => {
    try {
      const response = await fetch('http://18.236.227.203:5001/deleteScan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId, key: scanToDelete }),
      });
      console.log(response);

      if (!response.ok) {
        throw new Error('Failed to delete scan');
      }

      // Update the state to remove the deleted scan
      setScans((prevScans) => prevScans.filter((scan) => scan.scankey !== scanToDelete));
      console.log('Scan deleted successfully:', scanToDelete);
      setShowModal(false);
    } catch (error) {
      console.error('Error deleting scan:', error);
    }
  };
  
  
  
  const handleAddScan = (newScan) => {
    setScans((prevScans) => [...prevScans, newScan]); // Add the new scan to the state
  };

  return (
    <div className="container">
        <div className="header-wrapper">
            <h1>Scans</h1>
            <Authentication/>
        </div>
        
      <ScanList scans={scans} onDelete={displayModal} onAddScan={handleAddScan} />
      <div className={`deleteWarn-container ${showModal ? "show" : ""}`}>
        {showModal && (
        <div className="deleteWarn-modal">
        <h2 className="deleteWarn-heading">Are you Sure?</h2>
        <div className="deleteWarnbutton-wrapper">
            <button
            className="deletWarn-button yes" // Updated to match CSS
            onClick={handleDeleteScan}
            >
            Yes
            </button>
            <button
            className="deletWarn-button cancel" // Updated to match CSS
            onClick={handleCloseModal}
            >
            No
            </button>
        </div>
    </div>
    )}
</div>
</div>
  );
};

export default FilesPage;
