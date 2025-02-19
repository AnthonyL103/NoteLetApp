import { createContext, useContext, useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { useScan } from '../scans/ScanContext';


// Create Context
const UserContext = createContext();

export const UserProvider = ({ children }) => {
    const { currentScan, setCurrentScan } = useScan(); 
    const [userId, setUserId] = useState(() => {
        let storedUserId = localStorage.getItem("userId") || sessionStorage.getItem("guestUserId");
        
        if (!storedUserId) {
            storedUserId = `guest-${uuidv4()}`;
            sessionStorage.setItem("guestUserId", storedUserId);
        }
        return storedUserId;
    });

    const [email, setEmail] = useState(() => localStorage.getItem("email") || null);
    const [name, setName] = useState(() => localStorage.getItem("name") || null);
    const [totalScans, setTotalScans] = useState(0);
    const [totalFlashcards, setTotalFlashcards] = useState(0);
    const [totalMockTests, setTotalMockTests] = useState(0);
    
    const deleteGuestData = (guestId) => {
        if (!guestId || !guestId.startsWith("guest-")) return;
        setCurrentScan(null);

        console.log(`Attempting to delete guest user data: ${guestId}`);
        
        fetch(`https://api.zukini.com/display/deleteGuestAll?userId=${guestId}`, {
            method: 'DELETE',
            keepalive: true,  // Ensures the request completes before unload
            headers: {
                'Content-Type': 'application/json',
            },
        }).then(response => {
            if (!response.ok) {
                console.error("Failed to delete guest data.");
            }
            
        }).catch(error => console.error("Error deleting guest data:", error));
    };
    useEffect(() => {
        const handleUnload = () => {
            deleteGuestData(sessionStorage.getItem("guestUserId"));
        };


        window.addEventListener("beforeunload", handleUnload);

        return () => {
            window.removeEventListener("beforeunload", handleUnload);
        };
    }, []);

    
    // Save userId and email to localStorage
    
    useEffect(() => {
        if (userId && !userId.startsWith("guest-")) {
            const storedUserId = localStorage.getItem("userId");
            const storedEmail = localStorage.getItem("email");
            const storedName = localStorage.getItem("name");
    
            // Only update localStorage if the values have changed
            if (storedUserId !== userId || storedEmail !== email || storedName !== name) {
                localStorage.setItem("userId", userId);
                localStorage.setItem("email", email);
                localStorage.setItem("name", name);
            }
    
            // Delete guest data once the user logs in
            if (sessionStorage.getItem("guestUserId")) {
                deleteGuestData(sessionStorage.getItem("guestUserId"));
                sessionStorage.removeItem("guestUserId");
            }
        }
    }, [userId, email, name]);  
    

    // Fetch total scans, flashcards, and mock tests when userId changes
    
    useEffect(() => {
        if (!userId || userId.startsWith("guest-")) return;
    
        let isMounted = true; // Track component mount state
    
        const fetchUserStats = async () => {
            try {
                const [fcRes, mtRes, scanRes] = await Promise.allSettled([
                    fetch(`https://api.zukini.com/display/displayflashcards?userId=${userId}`),
                    fetch(`https://api.zukini.com/display/displaymocktests?userId=${userId}`),
                    fetch(`https://api.zukini.com/display/displayscans?userId=${userId}`)
                ]);
    
                const parseResponse = async (res) => 
                    res.status === "fulfilled" && res.value.ok ? res.value.json() : [];
    
                const [FC, MT, Scans] = await Promise.all([
                    parseResponse(fcRes),
                    parseResponse(mtRes),
                    parseResponse(scanRes),
                ]);
    
                if (isMounted) {
                    setTotalFlashcards(FC?.length || 0);
                    setTotalMockTests(MT?.length || 0);
                    setTotalScans(Scans?.length || 0);
                }
            } catch (error) {
                console.error("Error fetching user stats:", error);
            }
        };
    
        fetchUserStats();
        
        return () => {
            isMounted = false; 
        };
    }, [userId]);
    

    return (
        <UserContext.Provider value={{
            userId, setUserId,
            email, setEmail,
            totalScans, setTotalScans,
            totalFlashcards, setTotalFlashcards,
            totalMockTests, setTotalMockTests,
            name, setName
        }}>
            {children}
        </UserContext.Provider>
    );
};

// Hook to use UserContext
export const useUser = () => useContext(UserContext);
