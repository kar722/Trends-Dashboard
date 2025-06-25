import React from 'react';
import {
  ComposableMap,
  Geographies,
  Geography
} from 'react-simple-maps';
import { scaleLinear } from 'd3-scale';

const geoUrl = 'https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json';

interface StateInterest {
  state_code: string;
  interest: number;
}

interface Props {
  data: StateInterest[];
}

interface GeoProperties {
  postal?: string;
  name?: string;
  [key: string]: any;
}

interface Geo {
  rsmKey: string;
  properties: GeoProperties;
  [key: string]: any;
}

const USHeatmap: React.FC<Props> = ({ data }) => {
  // Calculate the actual min and max from your data
  const allInterests = data.map(item => item.interest);
  const minInterest = Math.min(...allInterests);
  const maxInterest = Math.max(...allInterests);
  
  // Create color scale with actual data range
  const colorScale = scaleLinear<string>()
    .domain([minInterest, maxInterest])
    .range(['#cfe3f3', '#08306b']); // Light blue to dark blue
  
  // Create a map for quick lookups
  const interestMap = new Map(data.map(item => [item.state_code, item.interest]));
  
  return (
    <ComposableMap projection="geoAlbersUsa" width={800} height={500}>
      <Geographies geography={geoUrl}>
        {({ geographies }: { geographies: Geo[] }) =>
          geographies.map((geo: Geo) => {
            const stateCode = geo.properties?.postal ?? ''; 
            const interest = interestMap.get(stateCode);
            
            // Only render states that have data
            const fillColor = interest !== undefined 
              ? colorScale(interest) 
              : '#f0f0f0'; // Light gray for states without data
            
            return (
              <Geography
                key={geo.rsmKey}
                geography={geo}
                fill={fillColor}
                stroke="#FFF"
                strokeWidth={0.5}
                style={{
                  default: { outline: 'none' },
                  hover: { 
                    fill: interest !== undefined ? '#4682b4' : '#d3d3d3', 
                    outline: 'none' 
                  },
                  pressed: { outline: 'none' }
                }}
              />
            );
          })
        }
      </Geographies>
    </ComposableMap>
  );
};

export default USHeatmap;
