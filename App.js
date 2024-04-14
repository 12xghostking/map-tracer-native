import React, { useState, useRef } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, TextInput, Modal, Button } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import Geocoder from 'react-native-geocoding';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

// Initialize Geocoder with your API key
Geocoder.init("AIzaSyA6sGrSVboTUgsbAG6dgTwd9WHlM_o6VCA");

const App = () => {
  const [region, setRegion] = useState({
    latitude: 43.2557,
    longitude: -79.8711,
    latitudeDelta: 0.0922,
    longitudeDelta: 0.0421,
  });
  const [markers, setMarkers] = useState([]);
  const [polylineCoords, setPolylineCoords] = useState([]);
  const [searchLocation, setSearchLocation] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [location1, setLocation1] = useState('');
  const [location2, setLocation2] = useState('');
  const [scrollEnabled, setScrollEnabled] = useState(true); // State for enabling/disabling map scroll
  const [mapDraggingEnabled, setMapDraggingEnabled] = useState(true); // State for enabling/disabling map dragging

  const mapViewRef = useRef(null);

  const handleMapPress = (e) => {
    const { coordinate } = e.nativeEvent;
    
    // Check if the clicked coordinate matches any existing marker's coordinate
    const markerIndex = markers.findIndex(marker => 
      marker.coordinate.latitude === coordinate.latitude && 
      marker.coordinate.longitude === coordinate.longitude
    );
      // Check if a polyline exists
  if (polylineCoords.length > 0) {
    // Remove the polyline
    setPolylineCoords([]);
  }
    if (markerIndex !== -1) {
      // If the clicked coordinate matches, remove that marker
      const updatedMarkers = [...markers];
      updatedMarkers.splice(markerIndex, 1);
      setMarkers(updatedMarkers);
    } else {
      // If the clicked coordinate doesn't match, add a new marker
      setMarkers([...markers, { coordinate, name: `Location ${markers.length + 1}` }]);
    }
  };
  
  

  const handleModalOpen = () => {
    setModalVisible(true);
  };

  const handleModalClose = () => {
    setModalVisible(false);
  };

  const handleCalculateDistance = () => {
    if (markers.length !== 2) {
      // Show an error alert if there are not exactly two markers on the map
      alert("Please add exactly two markers on the map to calculate the distance.");
      return;
    }
  
    const { coordinate: coord1 } = markers[0];
    const { coordinate: coord2 } = markers[1];
  
    const distance = calculateDistance(coord1, coord2);
    alert(`Distance between markers: ${distance.toFixed(2)} miles`);
  };
  

  const calculateDistance = (coord1, coord2) => {
    const R = 3958.8; // Earth's radius in miles
    const lat1 = coord1.latitude * Math.PI / 180;
    const lat2 = coord2.latitude * Math.PI / 180;
    const dLat = (coord2.latitude - coord1.latitude) * Math.PI / 180;
    const dLon = (coord2.longitude - coord1.longitude) * Math.PI / 180;

    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(lat1) * Math.cos(lat2) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = R * c;
    return distance;
  };

  const handleModalSubmit = async () => {
    if (location1 && location2) {
      try {
        // Perform a Google Places Autocomplete search for the entered locations
        const [result1, result2] = await Promise.all([
          searchsLocation(location1),
          searchsLocation(location2),
        ]);
  
        // Extract latitude and longitude from the search results
        const { geometry: { location: { lat: lat1, lng: lng1 } } } = result1;
        const { geometry: { location: { lat: lat2, lng: lng2 } } } = result2;
  
        // Set the region to include both locations
        setRegion({
          latitude: (lat1 + lat2) / 2,
          longitude: (lng1 + lng2) / 2,
          latitudeDelta: Math.abs(lat1 - lat2) * 2.5,
          longitudeDelta: Math.abs(lng1 - lng2) * 2.5,
        });
  
        // Update markers to include the new locations and remove previous markers
        setMarkers([
          { coordinate: { latitude: lat1, longitude: lng1 }, name: location1 },
          { coordinate: { latitude: lat2, longitude: lng2 }, name: location2 },
        ]);
  
        // Update polyline coordinates
        setPolylineCoords([
          { latitude: lat1, longitude: lng1 },
          { latitude: lat2, longitude: lng2 },
        ]);
  
        // Calculate distance between the two locations
        const distance = calculateDistance({ latitude: lat1, longitude: lng1 }, { latitude: lat2, longitude: lng2 });
        alert(`Distance between ${location1} and ${location2}: ${distance.toFixed(2)} miles`);
        handleModalClose();  setLocation1('');
        setLocation2('');
      } catch (error) {
        console.error('Error fetching location details:', error);  setLocation1('');
        setLocation2('');
        handleModalClose();
      }
      finally{
        handleModalClose();
        setLocation1('');
        setLocation2('');
      }
    }
  };
  
  // Function to perform Google Places Autocomplete search
  const searchsLocation = async (location) => {
    try {
      const response = await fetch(`https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${location}&inputtype=textquery&fields=geometry&key=AIzaSyAeMPtZqyOjd_5LjSCXdG1cJssu6cdiclM`);
      const data = await response.json();
      if (data.status === 'OK' && data.candidates && data.candidates.length > 0) {
        return data.candidates[0];
      } else {
        throw new Error('No results found for the location.');
      }
    } catch (error) {
      throw new Error('Error fetching location details:', error);
    }
  };

  const toggleMapDrag = () => {
    setScrollEnabled(!scrollEnabled);
  };
  

  const handleMapPanDrag = () => {
    if (!mapDraggingEnabled) {
      setMapDraggingEnabled(true);
    }
  };

  return (
    <View style={styles.container}>
      <MapView
        ref={mapViewRef}
        style={styles.map}
        region={region}
        onPress={handleMapPress}
        scrollEnabled={scrollEnabled} // Dynamically set scrollEnabled based on state
        // onPanDrag={handleMapPanDrag} // Disable map scrolling when dragging
        // onMapReady={() => setScrollEnabled(true)} // Re-enable map scrolling when map is ready
        // onTouchStart={() => {
        //   if (!mapDraggingEnabled) {
        //     setScrollEnabled(true);
        //   }
        // }}
      >
        {markers.map((marker, index) => (
          <Marker
            key={index}
            coordinate={marker.coordinate}
            pinColor={index === markers.length - 1 ? 'red' : 'blue'}
          />
        ))}
        {polylineCoords.length > 1 && (
          <Polyline coordinates={polylineCoords} strokeWidth={4} strokeColor="blue" />
        )}
      </MapView>
      <View style={styles.buttonContainerTop}>
        <View>
        <TouchableOpacity style={styles.button} onPress={toggleMapDrag}>
          <Text>{scrollEnabled ? 'Stop Drag' : 'Allow  Drag'}</Text>
        </TouchableOpacity></View>
        <View style={{ flex: 1, marginHorizontal: 10 }}>
        <GooglePlacesAutocomplete
  placeholder="Search "
  onPress={(data, details = null) => {
    // 'details' is provided when fetchDetails = true
    const { lat, lng } = details.geometry.location;
    setRegion({ ...region, latitude: lat, longitude: lng });
    mapViewRef.current.animateToRegion({
      latitude: lat,
      longitude: lng,
      latitudeDelta: region.latitudeDelta,
      longitudeDelta: region.longitudeDelta,
    });
    setSearchLocation(data.description);
  }}
  query={{
    key: 'AIzaSyAeMPtZqyOjd_5LjSCXdG1cJssu6cdiclM',
    language: 'en', // language of the results
  }}
  fetchDetails={true} // Fetch details including latitude and longitude
  styles={{
    textInputContainer: {
      backgroundColor: 'rgba(0, 0, 0, 0)',
      borderTopWidth: 0,
      borderBottomWidth: 0,
      width: '100%',
    },
    textInput: {
      marginLeft: 0,
      marginRight: 0,
      height: 38,
      color: '#000', // Changed text color to black
      fontSize: 16,
    },
    predefinedPlacesDescription: {
      color: '#1faadb',
    },
  }}
  // Ensure that the cross button works by setting closeIconProps to null
  renderRightButton={() => null}
/>

</View>

      
      </View>
      <View style={styles.buttonContainerBottom}>
        <TouchableOpacity style={styles.button} onPress={handleModalOpen}>
          <Text>Select Locations</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.button} onPress={handleCalculateDistance}>
          <Text>Calculate Distance</Text>
        </TouchableOpacity>
      </View>
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalContainer}>
          <TextInput
            style={styles.input}
            placeholder="Location 1"
            value={location1}
            onChangeText={(text) => setLocation1(text)}
          />
          <TextInput
            style={styles.input}
            placeholder="Location 2"
            value={location2}
            onChangeText={(text) => setLocation2(text)}
          />
          <Button title="Submit" onPress={handleModalSubmit} />
          <Button title="Close" onPress={handleModalClose} />
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  buttonContainerTop: {
    position: 'absolute',
   
    top: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    width: '100%',
  },
  buttonContainerBottom: {
    position: 'absolute',
    bottom: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    width: '100%',
  },
  button: {
    backgroundColor: 'lightgray',
    padding: 10,
    borderRadius: 5,
  },
  input: {
    backgroundColor: 'white',
    height: 40,
    padding: 10,
    margin: 10,
    borderRadius: 5,
    width: '100%',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
});

export default App;
