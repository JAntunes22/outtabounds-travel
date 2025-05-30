import React, { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebaseConfig';
import { useAuth } from './AuthContext';
import Logger from '../utils/logger';

const PackContext = createContext();

export function usePack() {
  const context = useContext(PackContext);
  if (!context) {
    throw new Error('usePack must be used within a PackProvider');
  }
  return context;
}

export function PackProvider({ children }) {
  const [packItems, setPackItems] = useState([]);
  const [bookingDetails, setBookingDetails] = useState({
    travelDates: {
      startDate: '',
      endDate: ''
    },
    dateFlexibility: 'no-flexibility',
    numberOfPeople: 1,
    reservationHolder: {
      email: '',
      firstName: '',
      lastName: '',
      age: '',
      gender: '',
      mobile: '',
      countryCode: '+1'
    },
    travelers: [{ 
      email: '', 
      firstName: '', 
      lastName: '', 
      age: '', 
      gender: '', 
      playingGolf: true, 
      requiresEquipment: false,
      sameAsReservationHolder: false
    }],
    specialRequests: {
      golfRounds: 0,
      notes: '',
      budgetMin: 0,
      budgetMax: 5000
    }
  });
  const { currentUser } = useAuth();

  // Add refs to track if we're in the middle of updating to prevent loops
  const isUpdatingBookingDetails = useRef(false);
  const isUpdatingPackItems = useRef(false);

  // Load user's pack items from Firestore or localStorage on component mount/user change
  const loadUserPack = useCallback(async () => {
    try {
      if (currentUser) {
        // User is logged in, try to get pack from Firestore
        Logger.debug(`Loading pack from Firestore for user: ${currentUser.uid}`);
        const userPackRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userPackRef);
        
        if (userDoc.exists() && userDoc.data().packItems) {
          // User has pack items in Firestore
          setPackItems(userDoc.data().packItems);
          Logger.debug("Loaded pack items from Firestore");
        } else {
          // User document doesn't exist or has no packItems
          // Initialize with empty pack instead of transferring from localStorage
          
          // Check if we need to create or update the document
          if (!userDoc.exists()) {
            // Create new document with empty pack
            await setDoc(userPackRef, { 
              packItems: [],
              bookingDetails: {
                travelDates: {
                  startDate: '',
                  endDate: ''
                },
                dateFlexibility: 'no-flexibility',
                numberOfPeople: 1,
                reservationHolder: {
                  email: '',
                  firstName: '',
                  lastName: '',
                  age: '',
                  gender: '',
                  mobile: '',
                  countryCode: '+1'
                },
                travelers: [{ email: '', firstName: '', lastName: '', age: '', gender: '', playingGolf: true, requiresEquipment: false, sameAsReservationHolder: false }],
                specialRequests: {
                  golfRounds: 0,
                  notes: '',
                  budgetMin: 0,
                  budgetMax: 5000
                }
              } 
            });
            Logger.debug("Created new user document with empty pack");
          } else {
            // Document exists but doesn't have packItems field
            await updateDoc(userPackRef, { packItems: [] });
            Logger.debug("Updated existing user document with empty pack");
          }
          
          // Set empty pack
          setPackItems([]);
          
          // Clear localStorage to avoid confusion
          localStorage.removeItem('userPack');
        }
        
        // Load booking details
        if (userDoc.exists() && userDoc.data().bookingDetails) {
          setBookingDetails(userDoc.data().bookingDetails);
          Logger.debug("Loaded booking details from Firestore");
        } else {
          // Initialize with empty booking details instead of transferring from localStorage
          const defaultBookingDetails = {
            travelDates: {
              startDate: '',
              endDate: ''
            },
            dateFlexibility: 'no-flexibility',
            numberOfPeople: 1,
            reservationHolder: {
              email: '',
              firstName: '',
              lastName: '',
              age: '',
              gender: '',
              mobile: '',
              countryCode: '+1'
            },
            travelers: [{ 
              email: '', 
              firstName: '', 
              lastName: '', 
              age: '', 
              gender: '', 
              playingGolf: true, 
              requiresEquipment: false,
              sameAsReservationHolder: false
            }],
            specialRequests: {
              golfRounds: 0,
              notes: '',
              budgetMin: 0,
              budgetMax: 5000
            }
          };
          
          // Update the document with empty booking details
          if (userDoc.exists()) {
            await updateDoc(userPackRef, { bookingDetails: defaultBookingDetails });
            Logger.debug("Updated document with empty booking details");
          }
          
          // Set empty booking details
          setBookingDetails(defaultBookingDetails);
          
          // Clear localStorage to avoid confusion
          localStorage.removeItem('bookingDetails');
        }
      } else {
        // No logged in user, use localStorage
        const savedPack = localStorage.getItem('userPack');
        if (savedPack) {
          try {
            setPackItems(JSON.parse(savedPack));
          } catch (error) {
            Logger.error('Failed to parse pack items from localStorage:', error);
          }
        }
        
        const savedBookingDetails = localStorage.getItem('bookingDetails');
        if (savedBookingDetails) {
          try {
            setBookingDetails(JSON.parse(savedBookingDetails));
          } catch (error) {
            Logger.error('Failed to parse booking details from localStorage:', error);
          }
        }
      }
    } catch (error) {
      Logger.error('Error loading user pack:', error);
      // Fall back to localStorage only when not logged in
      if (!currentUser) {
        const savedPack = localStorage.getItem('userPack');
        if (savedPack) {
          try {
            setPackItems(JSON.parse(savedPack));
          } catch (error) {
            Logger.error('Failed to parse pack items from localStorage:', error);
          }
        }
      }
    }
  }, [currentUser]);

  useEffect(() => {
    loadUserPack();
  }, [loadUserPack]);

  // Save pack items whenever they change
  useEffect(() => {
    // Prevent multiple simultaneous saves
    if (isUpdatingPackItems.current) return;
    
    // Debounce the save operation to prevent excessive Firebase writes
    const timeoutId = setTimeout(async () => {
      isUpdatingPackItems.current = true;
      try {
        if (currentUser) {
          // User is logged in, save to Firestore
          const userPackRef = doc(db, "users", currentUser.uid);
          
          // Check if the document exists first
          const userDoc = await getDoc(userPackRef);
          
          if (userDoc.exists()) {
            // Update the existing document
            await updateDoc(userPackRef, { packItems });
          } else {
            // Create a new document
            await setDoc(userPackRef, { 
              packItems,
              bookingDetails: {
                travelDates: {
                  startDate: '',
                  endDate: ''
                },
                dateFlexibility: 'no-flexibility',
                numberOfPeople: 1,
                reservationHolder: {
                  email: '',
                  firstName: '',
                  lastName: '',
                  age: '',
                  gender: '',
                  mobile: '',
                  countryCode: '+1'
                },
                travelers: [{ email: '', firstName: '', lastName: '', age: '', gender: '', playingGolf: true, requiresEquipment: false, sameAsReservationHolder: false }],
                specialRequests: {
                  golfRounds: 0,
                  notes: '',
                  budgetMin: 0,
                  budgetMax: 5000
                }
              }
            });
          }
          Logger.debug("Saved pack items to Firestore");
        } else {
          // No logged in user, save to localStorage
          localStorage.setItem('userPack', JSON.stringify(packItems));
        }
      } catch (error) {
        // Handle quota exhausted errors gracefully
        if (error.code === 'resource-exhausted') {
          Logger.warn('Firebase quota exceeded, falling back to localStorage');
          localStorage.setItem('userPack', JSON.stringify(packItems));
        } else {
          Logger.error('Error saving pack items:', error);
          // Fall back to localStorage for any error
          localStorage.setItem('userPack', JSON.stringify(packItems));
        }
      } finally {
        isUpdatingPackItems.current = false;
      }
    }, 1000); // Increased debounce to 1 second for better protection
    
    // Cleanup timeout on unmount or dependency change
    return () => clearTimeout(timeoutId);
  }, [packItems, currentUser]);

  // Save booking details whenever they change
  useEffect(() => {
    // Prevent multiple simultaneous saves
    if (isUpdatingBookingDetails.current) return;
    
    // Debounce the save operation to prevent excessive Firebase writes
    const timeoutId = setTimeout(async () => {
      isUpdatingBookingDetails.current = true;
      try {
        if (currentUser) {
          // User is logged in, save to Firestore
          const userPackRef = doc(db, "users", currentUser.uid);
          
          // Check if the document exists first
          const userDoc = await getDoc(userPackRef);
          
          if (userDoc.exists()) {
            await updateDoc(userPackRef, { bookingDetails });
          } else {
            await setDoc(userPackRef, { 
              bookingDetails,
              packItems: [] 
            });
          }
          Logger.debug("Saved booking details to Firestore");
        } else {
          // No logged in user, save to localStorage
          localStorage.setItem('bookingDetails', JSON.stringify(bookingDetails));
        }
      } catch (error) {
        // Handle quota exhausted errors gracefully
        if (error.code === 'resource-exhausted') {
          Logger.warn('Firebase quota exceeded, falling back to localStorage');
          localStorage.setItem('bookingDetails', JSON.stringify(bookingDetails));
        } else {
          Logger.error('Error saving booking details:', error);
          // Fall back to localStorage for any error
          localStorage.setItem('bookingDetails', JSON.stringify(bookingDetails));
        }
      } finally {
        isUpdatingBookingDetails.current = false;
      }
    }, 1000); // Increased debounce to 1 second for better protection
    
    // Cleanup timeout on unmount or dependency change
    return () => clearTimeout(timeoutId);
  }, [bookingDetails, currentUser]);

  // Add an item to the pack
  const addToPack = (item) => {
    setPackItems(prevItems => {
      // Check if item already exists
      const exists = prevItems.find(i => i.id === item.id && i.type === item.type);
      if (exists) {
        return prevItems; // Item already in pack, don't add again
      }
      return [...prevItems, { ...item, addedAt: new Date().toISOString() }];
    });
  };

  // Remove an item from the pack
  const removeFromPack = (itemId, itemType) => {
    setPackItems(prevItems => 
      prevItems.filter(item => !(item.id === itemId && item.type === itemType))
    );
  };

  // Clear all items from the pack
  const clearPack = async () => {
    setPackItems([]);
    
    // Also clear from Firestore if user is logged in
    if (currentUser) {
      try {
        const userPackRef = doc(db, "users", currentUser.uid);
        const userDoc = await getDoc(userPackRef);
        
        if (userDoc.exists()) {
          await updateDoc(userPackRef, { packItems: [] });
          Logger.debug("Cleared pack items from Firestore");
        }
      } catch (error) {
        Logger.error('Error clearing pack items from Firestore:', error);
      }
    }
  };

  // Update booking details
  const updateBookingDetails = (details) => {
    setBookingDetails(prevDetails => {
      // Only update if there are actual changes
      const hasChanges = Object.keys(details).some(key => {
        if (typeof details[key] === 'object' && details[key] !== null) {
          return JSON.stringify(details[key]) !== JSON.stringify(prevDetails[key]);
        }
        return details[key] !== prevDetails[key];
      });
      
      if (!hasChanges) {
        return prevDetails; // No changes, return the same reference
      }
      
      // Ensure we have the full structure before updating
      const fullStructure = {
        travelDates: prevDetails.travelDates || {
          startDate: '',
          endDate: ''
        },
        dateFlexibility: prevDetails.dateFlexibility || 'no-flexibility',
        numberOfPeople: prevDetails.numberOfPeople || 1,
        reservationHolder: prevDetails.reservationHolder || {
          email: '',
          firstName: '',
          lastName: '',
          age: '',
          gender: '',
          mobile: '',
          countryCode: '+1'
        },
        travelers: prevDetails.travelers || [{ 
          email: '', 
          firstName: '', 
          lastName: '', 
          age: '', 
          gender: '', 
          playingGolf: true, 
          requiresEquipment: false,
          sameAsReservationHolder: false
        }],
        specialRequests: prevDetails.specialRequests || {
          golfRounds: 0,
          notes: '',
          budgetMin: 0,
          budgetMax: 5000
        }
      };
      
      return {
        ...fullStructure,
        ...details // Apply new changes
      };
    });
  };

  // Add or update a traveler
  const updateTraveler = (index, travelerData) => {
    setBookingDetails(prevDetails => {
      const updatedTravelers = [...prevDetails.travelers];
      updatedTravelers[index] = {
        ...updatedTravelers[index],
        ...travelerData
      };
      return {
        ...prevDetails,
        travelers: updatedTravelers
      };
    });
  };

  // Add a new traveler
  const addTraveler = () => {
    setBookingDetails(prevDetails => ({
      ...prevDetails,
      travelers: [
        ...prevDetails.travelers, 
        { email: '', firstName: '', lastName: '', age: '', gender: '', playingGolf: true, requiresEquipment: false, sameAsReservationHolder: false }
      ]
    }));
  };

  // Remove a traveler
  const removeTraveler = (index) => {
    setBookingDetails(prevDetails => {
      const updatedTravelers = prevDetails.travelers.filter((_, i) => i !== index);
      return {
        ...prevDetails,
        travelers: updatedTravelers,
        numberOfPeople: updatedTravelers.length
      };
    });
  };

  // Update reservation holder
  const updateReservationHolder = (holderData) => {
    setBookingDetails(prevDetails => ({
      ...prevDetails,
      reservationHolder: {
        ...prevDetails.reservationHolder,
        ...holderData
      }
    }));
  };

  // Update special requests
  const updateSpecialRequests = (requestsData) => {
    setBookingDetails(prevDetails => ({
      ...prevDetails,
      specialRequests: {
        ...prevDetails.specialRequests,
        ...requestsData
      }
    }));
  };

  const value = {
    packItems,
    bookingDetails,
    addToPack,
    removeFromPack,
    clearPack,
    updateBookingDetails,
    updateTraveler,
    addTraveler,
    removeTraveler,
    updateReservationHolder,
    updateSpecialRequests
  };

  return (
    <PackContext.Provider value={value}>
      {children}
    </PackContext.Provider>
  );
} 