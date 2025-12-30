import { useState } from 'react';
import './App.css';
import MapComponent from './components/MapContainer';
import StationList from './components/StationList';
import ReportModal from './components/ReportModal';
import { INITIAL_STATIONS } from './services/mockData';

function App() {
  const [stations, setStations] = useState(INITIAL_STATIONS);
  const [selectedStation, setSelectedStation] = useState(null);
  const [reportModalData, setReportModalData] = useState({ isOpen: false, station: null });

  const handleStationSelect = (station) => {
    setSelectedStation(station);
  };

  const handleReportClick = (station) => {
    setReportModalData({ isOpen: true, station });
  };

  const handleReportSubmit = (status) => {
    if (!reportModalData.station) return;

    const updatedStations = stations.map(s => {
      if (s.id === reportModalData.station.id) {
        return {
          ...s,
          status: status,
          lastUpdated: new Date().toISOString()
        };
      }
      return s;
    });

    setStations(updatedStations);

    // If the currently selected station is the one being updated, update it too to reflect changes immediately in UI if needed
    if (selectedStation && selectedStation.id === reportModalData.station.id) {
      const updatedStation = updatedStations.find(s => s.id === selectedStation.id);
      setSelectedStation(updatedStation);
    }

    setReportModalData({ isOpen: false, station: null });
  };

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', background: 'var(--bg-primary)' }}>
      <StationList
        stations={stations}
        onSelect={handleStationSelect}
        selectedStationId={selectedStation?.id}
      />

      <div style={{ flex: 1, position: 'relative' }}>
        <MapComponent
          stations={stations}
          onStationSelect={handleStationSelect}
          selectedStation={selectedStation}
          onReportClick={handleReportClick}
        />
      </div>

      <ReportModal
        isOpen={reportModalData.isOpen}
        station={reportModalData.station}
        onClose={() => setReportModalData({ isOpen: false, station: null })}
        onSubmit={handleReportSubmit}
      />
    </div>
  );
}

export default App;
