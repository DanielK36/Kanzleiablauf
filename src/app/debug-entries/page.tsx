"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function DebugEntriesPage() {
  const [debugData, setDebugData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const fetchDebugData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/debug-daily-entries');
      const data = await response.json();
      setDebugData(data);
    } catch (error) {
      console.error('Error fetching debug data:', error);
      setDebugData({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebugData();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">🔍 Debug: Daily Entries</CardTitle>
          </CardHeader>
          <CardContent>
            <Button onClick={fetchDebugData} disabled={loading} className="mb-4">
              {loading ? 'Lade...' : 'Daten aktualisieren'}
            </Button>

            {debugData && (
              <div className="space-y-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-blue-800 mb-2">👤 User Info:</h3>
                  <pre className="text-sm text-blue-700 overflow-x-auto">
                    {JSON.stringify(debugData.debug?.user, null, 2)}
                  </pre>
                </div>

                <div className="bg-green-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-green-800 mb-2">📅 Date Info:</h3>
                  <pre className="text-sm text-green-700 overflow-x-auto">
                    {JSON.stringify(debugData.debug?.dates, null, 2)}
                  </pre>
                </div>

                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-yellow-800 mb-2">📊 Entries Count:</h3>
                  <p className="text-yellow-700">
                    {debugData.debug?.entriesCount} Einträge in den letzten 7 Tagen
                  </p>
                </div>

                <div className="bg-purple-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-purple-800 mb-2">🎯 Yesterday Entry:</h3>
                  {debugData.debug?.yesterdayEntry ? (
                    <pre className="text-sm text-purple-700 overflow-x-auto">
                      {JSON.stringify(debugData.debug.yesterdayEntry, null, 2)}
                    </pre>
                  ) : (
                    <p className="text-purple-700">❌ Kein Eintrag für gestern gefunden</p>
                  )}
                </div>

                <div className="bg-red-50 p-4 rounded-lg">
                  <h3 className="font-semibold text-red-800 mb-2">📋 All Entries (Last 7 Days):</h3>
                  {debugData.debug?.allEntries?.length > 0 ? (
                    <div className="space-y-2">
                      {debugData.debug.allEntries.map((entry: any, index: number) => (
                        <div key={index} className="bg-white p-3 rounded border">
                          <div className="font-semibold">📅 {entry.entry_date}</div>
                          <div className="text-sm text-gray-600">
                            FA: {entry.fa_count}, EH: {entry.eh_count}, Termine: {entry.new_appointments}
                          </div>
                          {entry.today_goals && (
                            <div className="text-xs text-gray-500 mt-1">
                              Goals: {JSON.stringify(entry.today_goals)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-red-700">❌ Keine Einträge in den letzten 7 Tagen</p>
                  )}
                </div>

                {debugData.debug?.error && (
                  <div className="bg-red-50 p-4 rounded-lg">
                    <h3 className="font-semibold text-red-800 mb-2">❌ Error:</h3>
                    <pre className="text-sm text-red-700 overflow-x-auto">
                      {JSON.stringify(debugData.debug.error, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            )}

            {debugData?.error && (
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <h3 className="font-semibold text-red-800 mb-2">❌ API Error:</h3>
                <p className="text-red-700">{debugData.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
