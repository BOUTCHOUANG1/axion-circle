import 'leaflet/dist/leaflet.css';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import MarkerClusterGroup from '@changey/react-leaflet-markercluster';
import L from 'leaflet';
import { MapPinned, List, RefreshCw, AlertCircle, MapPinOff, X, MapPin } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import MapErrorBoundary from './MapErrorBoundary';
import ReportListView from './ReportListView';
import fallbackImage from '../assets/fallback-image.svg';
import api from '../services/api';
import toast from 'react-hot-toast';

const timeAgo = (dateStr) => {
  if (!dateStr) return 'Just now';
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
};

const getMarkerIcon = (status) => {
  let color = '#3b82f6'; // default blue
  const s = (status || '').toLowerCase();
  if (s === 'reported') color = '#f59e0b'; // amber
  else if (s === 'acknowledged') color = '#3b82f6'; // blue
  else if (s === 'inprogress' || s === 'in progress') color = '#a855f7'; // purple
  else if (s === 'resolved') color = '#22c55e'; // green

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 36px; height: 36px; filter: drop-shadow(0px 2px 4px rgba(0,0,0,0.4));">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3.5" fill="white" stroke="none"></circle>
    </svg>
  `;
  return L.divIcon({
    className: 'custom-leaflet-pin bg-transparent border-none',
    html: `<div style="display: flex; flex-direction: column; align-items: center; justify-content: center; width: 36px; height: 36px; position: relative;">${svg}</div>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

const MapCenterUpdater = ({ center, isActive }) => {
  const map = useMap();
  useEffect(() => {
    if (isActive && center) {
      map.flyTo(center, 13, { duration: 1.5 });
    }
  }, [center, map, isActive]);
  return null;
};

const MapBoundsFit = ({ reports, userLocationFound }) => {
  const map = useMap();
  const [prevReportIds, setPrevReportIds] = useState('');

  useEffect(() => {
    // If we just found the user's location, don't immediately override it by fitting to all reports unless necessary
    if (userLocationFound) return;
    
    if (reports && reports.length > 0) {
      const currentIds = reports.map(r => r.id).sort().join(',');
      if (currentIds !== prevReportIds) {
        const bounds = L.latLngBounds(reports.map(r => [r.latitude, r.longitude]));
        map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
        setPrevReportIds(currentIds);
      }
    }
  }, [reports, map, prevReportIds, userLocationFound]);
  return null;
};

const MapInvalidateSize = () => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 100);
    return () => clearTimeout(timer);
  }, [map]);
  return null;
};

const MapCenterTracker = ({ onCityChange }) => {
  const map = useMapEvents({
    moveend: async () => {
      const center = map.getCenter();
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${center.lat}&lon=${center.lng}&zoom=10&addressdetails=1`, {
          headers: {
            "User-Agent": "CleanReport-App/1.0"
          }
        });
        const data = await res.json();
        if (data && data.address) {
          const city = data.address.city || data.address.town || data.address.state || 'the current area';
          onCityChange(city);
        }
      } catch (err) {
        console.error('Failed to reverse geocode map center', err);
      }
    }
  });
  return null;
};

export default function RegionalActivityMap({ reports, mapStatus, onRetry }) {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');
  const [activeFilter, setActiveFilter] = useState('All');
  const [viewMode, setViewMode] = useState('map'); // 'map' | 'list'
  const [currentCity, setCurrentCity] = useState('Lagos');
  const [gpsPermissionDenied, setGpsPermissionDenied] = useState(false);
  const [isOverviewDismissed, setIsOverviewDismissed] = useState(false);
  const [userLocationFound, setUserLocationFound] = useState(false);
  const [mapCenter, setMapCenter] = useState([6.5244, 3.3792]); // default Lagos

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGpsPermissionDenied(false);
          setMapCenter([position.coords.latitude, position.coords.longitude]);
          setUserLocationFound(true);
        },
        (error) => {
          if (error.code === error.PERMISSION_DENIED) {
            setGpsPermissionDenied(true);
          }
        }
      );
    }
  }, []);

  const [mapMarkers, setMapMarkers] = useState([]);
  const [markersLoading, setMarkersLoading] = useState(true);

  useEffect(() => {
    const fetchMarkers = async () => {
      try {
        const res = await api.get('/reports/map-markers');
        const data = res.data?.data || res.data;
        setMapMarkers(data || []);
      } catch (err) {
        console.error('Failed to fetch map markers', err);
        const errMsg = err.response?.data?.message || err.response?.data?.error || err.message;
        toast.error(`Map markers error: ${errMsg}`);
      } finally {
        setMarkersLoading(false);
      }
    };
    fetchMarkers();
  }, []);

  const filteredReports = reports.filter((r) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Overflow') return r.category === 'OVERFLOW' || (r.title && r.title.toLowerCase().includes('overflow'));
    if (activeFilter === 'Illegal Dumping') return r.category === 'ILLEGAL_DUMPING' || (r.title && r.title.toLowerCase().includes('dumping'));
    if (activeFilter === 'Blocked Drain') return r.category === 'BLOCKED_DRAIN' || (r.title && r.title.toLowerCase().includes('drain'));
    return true;
  });

  const filteredMarkers = mapMarkers.filter((r) => {
    if (activeFilter === 'All') return true;
    if (activeFilter === 'Overflow') return r.category === 'OVERFLOW' || (r.title && r.title.toLowerCase().includes('overflow'));
    if (activeFilter === 'Illegal Dumping') return r.category === 'ILLEGAL_DUMPING' || (r.title && r.title.toLowerCase().includes('dumping'));
    if (activeFilter === 'Blocked Drain') return r.category === 'BLOCKED_DRAIN' || (r.title && r.title.toLowerCase().includes('drain'));
    return true;
  });

  return (
    <div className="bg-white border border-white-stroke rounded-2xl shadow-sm flex flex-col overflow-hidden h-[450px]">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-white-stroke flex items-center justify-between bg-white z-10 relative">
        <h2 className="font-heading font-bold text-base sm:text-lg text-black">
          Regional Activity
        </h2>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-1.5 text-[10px] sm:text-xs font-semibold text-paragraph">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span> High Density
          </div>
          <div className="flex items-center gap-1 bg-white-bg2 p-1 rounded-lg border border-white-stroke">
            <button 
              onClick={() => setViewMode('map')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'map' ? 'bg-primary text-white shadow-sm' : 'text-paragraph hover:text-black hover:bg-white-bg'}`}
              aria-label="Map View"
            >
              <MapPinned className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-md transition-colors ${viewMode === 'list' ? 'bg-primary text-white shadow-sm' : 'text-paragraph hover:text-black hover:bg-white-bg'}`}
              aria-label="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filter Chips Bar (Above Map) */}
      <div className="px-4 py-3 bg-white-bg2 border-b border-white-stroke flex items-center gap-2 overflow-x-auto z-10 relative">
        {['All', 'Overflow', 'Illegal Dumping', 'Blocked Drain'].map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-colors border ${
              activeFilter === filter
                ? 'bg-primary text-white border-primary shadow-sm'
                : 'bg-white text-paragraph border-white-stroke hover:text-black hover:bg-white-bg'
            }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Status Color Legend */}
      <div className="px-4 py-2 bg-white border-b border-white-stroke flex items-center gap-4 sm:gap-6 overflow-x-auto z-10 relative shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#f59e0b]"></span>
          <span className="text-[10px] text-paragraph font-semibold tracking-wide">Reported</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#3b82f6]"></span>
          <span className="text-[10px] text-paragraph font-semibold tracking-wide">Acknowledged</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#a855f7]"></span>
          <span className="text-[10px] text-paragraph font-semibold tracking-wide">In Progress</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="w-2 h-2 rounded-full bg-[#22c55e]"></span>
          <span className="text-[10px] text-paragraph font-semibold tracking-wide">Resolved</span>
        </div>
      </div>

      {/* Map Area (Edge to Edge) */}
      <div className="w-full flex-1 min-h-0 bg-[#f0ede5] relative overflow-hidden bg-cover bg-center z-0 block">
        {(mapStatus === 'loading' || markersLoading) && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/50 backdrop-blur-sm z-20">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mb-2"></div>
            <span className="text-xs font-bold text-primary">Loading live map...</span>
          </div>
        )}
        {mapStatus === 'error' && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-white text-alert-error text-xs font-bold px-4 py-2 rounded-full shadow-lg border border-alert-error/20 flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span>Backend Sleeping</span>
            <button 
              onClick={onRetry} 
              className="ml-1 bg-alert-error/10 hover:bg-alert-error/20 text-alert-error p-1 rounded-full transition-colors"
              aria-label="Retry connection"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {viewMode === 'map' ? (
          <MapErrorBoundary onMapError={() => setViewMode('list')}>
            <MapContainer
              center={mapCenter}
              zoom={12}
              scrollWheelZoom={false}
              className="absolute inset-0 z-0"
              style={{ height: '100%', width: '100%' }}
              maxZoom={17}
            >
              <MapInvalidateSize />
              <MapCenterUpdater center={mapCenter} isActive={userLocationFound} />
              <MapBoundsFit reports={filteredMarkers.filter((r) => r.latitude && r.longitude)} userLocationFound={userLocationFound} />
              <MapCenterTracker onCityChange={setCurrentCity} />
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={17}
              />
              <MarkerClusterGroup
                chunkedLoading
                spiderfyOnMaxZoom={true}
                showCoverageOnHover={false}
                maxClusterRadius={40}
              >
                {filteredMarkers
                  .filter((r) => r.latitude && r.longitude) // Ensure coordinates exist
                  .map((report) => (
                  <Marker
                    key={report.id}
                    position={[report.latitude, report.longitude]}
                    icon={getMarkerIcon(report.status)}
                  >
                    <Popup className="custom-popup rounded-xl">
                      <div className="w-[200px]">
                        {report.photoUrl && (
                          <img 
                            src={report.photoUrl} 
                            alt="Thumbnail evidence for map report popup" 
                            width="200"
                            height="96"
                            loading="lazy"
                            className="w-full h-24 object-cover rounded-t-lg mb-2" 
                              onError={(e) => { e.target.onerror = null; e.target.src = fallbackImage; }}
                          />
                        )}
                        <div className={`p-3 ${report.photoUrl ? 'pt-0' : ''}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-sm ${
                              (report.status || '').toLowerCase() === 'resolved' ? 'bg-alert-successLight text-primary' :
                              (report.status || '').toLowerCase().replace(/[_ ]/g, '') === 'inprogress' ? 'bg-alert-inprogressLight text-alert-inprogress' :
                              (report.status || '').toLowerCase() === 'acknowledged' ? 'bg-alert-infoLight text-alert-info' :
                              'bg-alert-warningLight text-accent'
                            }`}>
                              {report.status || 'Reported'}
                            </span>
                            <span className="text-[9px] font-medium text-black-placeholder">{timeAgo(report.createdAt || report.date)}</span>
                          </div>
                          <h3 className="font-extrabold text-[13px] text-black uppercase mb-1 leading-tight">
                            {report.title || (report.category ? report.category.replace(/_/g, ' ') : 'Sanitation Issue')}
                          </h3>
                          <div className="flex items-start gap-1 text-[9px] text-gray-500 mb-2">
                            <MapPin className="w-2.5 h-2.5 mt-[2px] shrink-0" />
                            <span className="line-clamp-1 leading-tight">
                              {(report.address || report.areaName || '').includes('Location unavailable') 
                                ? 'Location not automatically captured' 
                                : (report.address || report.areaName || 'Location not captured')}
                            </span>
                          </div>
                          <p className="text-[10px] text-paragraph line-clamp-2 mb-3 leading-snug">
                            {report.description || 'Sanitation issue report'}
                          </p>
                          
                          <Link 
                            to={isAdmin ? `/admin/reports/${report.id}` : `/reports/${report.id}`}
                            className="block w-full py-2 bg-primary/10 text-primary text-[10px] font-bold text-center rounded-lg hover:bg-primary/20 transition-colors"
                            aria-label={`View details for ${report.title || 'report'} - Ref ${report.referenceId || report.id}`}
                          >
                            View Report
                          </Link>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            </MapContainer>
          </MapErrorBoundary>
        ) : viewMode === 'list' ? (
          <div className="w-full h-full z-10 relative">
            <ReportListView reports={filteredReports} />
          </div>
        ) : null}

        {/* Bottom Left District Overview Overlay */}
        {viewMode === 'map' && !isOverviewDismissed && (
          <div className="absolute bottom-3 left-3 sm:bottom-4 sm:left-4 bg-white border border-white-stroke rounded-lg p-3 sm:p-4 w-[200px] sm:w-[240px] shadow-lg z-[400]">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setIsOverviewDismissed(true);
              }}
              className="absolute top-2 right-2 p-1 text-gray-400 hover:text-gray-900 bg-gray-50 rounded-full transition-colors z-10"
              aria-label="Dismiss overview"
            >
              <X className="w-3.5 h-3.5" />
            </button>
            <h3 className="font-bold text-[11px] sm:text-xs text-black mb-1.5 pr-6">District Overview</h3>
            <p className="text-[9px] sm:text-[10px] text-paragraph leading-relaxed">
              Displaying {filteredMarkers.length} total active reports across all locations. Zoom out to view reports outside of {currentCity}.
            </p>
          </div>
        )}
      </div>

      {/* GPS Permission Denied Modal */}
      {gpsPermissionDenied && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setGpsPermissionDenied(false)}></div>
          <div className="bg-white w-full max-w-sm sm:max-w-md rounded-[24px] shadow-2xl relative z-10 flex flex-col items-center animate-in zoom-in-95 duration-200 p-6 sm:p-8 text-center">
            <button 
              onClick={() => setGpsPermissionDenied(false)} 
              className="absolute top-4 right-4 text-black-icon hover:text-black transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
            
            {/* Concentric red circles with MapPinOff icon */}
            <div className="w-20 h-20 bg-[#ffeceb] rounded-full flex items-center justify-center mb-6 relative">
              <div className="absolute inset-0 rounded-full border border-[#fdd8d6] scale-110"></div>
              <div className="absolute inset-0 rounded-full border border-[#fdd8d6] scale-125 opacity-50"></div>
              <MapPinOff className="w-8 h-8 text-[#E51B1B]" />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-black mb-3 font-heading tracking-tight">
              GPS Permission Denied
            </h2>
            
            <p className="text-sm sm:text-base text-paragraph mb-8 leading-relaxed">
              Live map features and real-time crew tracking are disabled because location access is blocked. Please enable GPS access in your browser settings to continue.
            </p>

            <div className="w-full flex flex-col gap-3">
              <button 
                onClick={() => setGpsPermissionDenied(false)}
                className="w-full py-3.5 bg-[#E51B1B] text-white rounded-xl text-sm sm:text-base font-bold shadow-sm hover:bg-[#d41919] transition-colors active:scale-[0.99]"
              >
                Delete
              </button>
              <button 
                onClick={() => setGpsPermissionDenied(false)}
                className="w-full py-3.5 bg-white border border-white-stroke text-black rounded-xl text-sm sm:text-base font-bold hover:bg-white-bg2 transition-colors active:scale-[0.99]"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
