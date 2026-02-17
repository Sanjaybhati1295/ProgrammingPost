// src/components/NotificationBadge/NotificationBadge.js
import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { useAuth } from '../../hooks/useAuth';
import './NotificationBadge.css'; // We'll create this next

const NotificationBadge = () => {
  const { user } = useAuth();
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    if (!user) return;

    // 1. Fetch the initial count of pending requests
    const fetchCount = async () => {
      const { count, error } = await supabase
        .from('connections')
        .select('id', { count: 'exact', head: true }) // head:true just gets the count
        .eq('receiver_id', user.id)
        .eq('status', 'pending');

      if (count) {
        setNotificationCount(count);
      }
    };
    fetchCount();

    // 2. Listen for REAL-TIME changes to the connections table
    const subscription = supabase.channel('public:connections')
      .on('postgres_changes', 
        { 
          event: '*', // Listen to INSERT, UPDATE, DELETE
          schema: 'public', 
          table: 'connections',
          filter: `receiver_id=eq.${user.id}` // Only listen for changes to *my* rows
        }, 
        (payload) => {
          // When a change happens, re-fetch the count
          console.log('Notification change detected!', payload);
          fetchCount(); 
        }
      )
      .subscribe();

    // 3. Cleanup subscription on unmount
    return () => {
      supabase.removeChannel(subscription);
    };

  }, [user]);

  if (notificationCount === 0) {
    return null; // Don't render anything if no notifications
  }

  // Render the red dot badge
  return (
    <span className="notification-badge">
      {notificationCount > 9 ? '9+' : notificationCount}
    </span>
  );
};

export default NotificationBadge;