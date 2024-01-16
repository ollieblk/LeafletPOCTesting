document.addEventListener('DOMContentLoaded', function () {
    // Add the Esri Vector Basemap layer
    const map = L.map("map", {
        minZoom: 2,
    });

    // Create and configure the 'labels' pane
    map.createPane('labels');
    const labelsPane = map.getPane('labels');
    labelsPane.style.zIndex = 650;
    labelsPane.style.pointerEvents = 'none';

    // Declare featureLayer2 outside the block
    let featureLayer2;

    // Function to create/update legend
    function updateLegend() {
        const legendContentDiv = document.getElementById('legend-content');
        if (!legendContentDiv) {
            console.error('Legend content div not found.');
            return;
        }

        // Clear existing legend content
        legendContentDiv.innerHTML = '';

        // Fetch drawing info using Fetch API
        const featureLayerUrl = "https://gis.wcc.govt.nz/arcgis/rest/services/DistrictPlanProposed/DistrictPlanProposed/MapServer/30";
        const drawingInfoUrl = `${featureLayerUrl}?f=json`;

        fetch(drawingInfoUrl)
            .then(response => response.json())
            .then(data => {
                const drawingInfo = data.drawingInfo;
                if (!drawingInfo || !drawingInfo.renderer || !drawingInfo.renderer.uniqueValueInfos) {
                    console.error('Drawing info not available.');
                    return;
                }

                // Process unique value infos
                drawingInfo.renderer.uniqueValueInfos.forEach(info => {
                    const label = info.label;
                    const symbol = info.symbol;

                    // Convert RGB color array to CSS color string
                    const color = `rgb(${symbol.color.join(',')})`;

                    // Create color swatch div
                    const colorSwatch = document.createElement('div');
                    colorSwatch.style.backgroundColor = color;
                    colorSwatch.style.width = '20px'; // Adjust width as needed
                    colorSwatch.style.height = '5px'; // Adjust height as needed
                    colorSwatch.style.display = 'inline-block';
                    colorSwatch.style.marginRight = '5px'; // Adjust margin as needed

                    // Create legend content for each unique value with symbology
                    const legendItem = document.createElement('div');
                    legendItem.appendChild(colorSwatch);
                    legendItem.innerHTML += label;

                    // Append legend item to the legend content div
                    legendContentDiv.appendChild(legendItem);
                });
            })
            .catch(error => {
                console.error('Error fetching drawing info:', error);
            });
    }

    // Function to toggle the legend visibility
    function toggleLegend() {
        const legendContentDiv = document.getElementById('legend-content');
        legendContentDiv.style.display = legendContentDiv.style.display === 'none' ? 'block' : 'none';

        // Add an event listener to the legend to capture the scroll event
        if (legendContentDiv.style.display === 'block') {
            legendContentDiv.addEventListener('wheel', function (event) {
                // Prevent the scroll event from reaching the map
                event.stopPropagation();
            });
        }
    }

    // Set initial map view
    map.setView([-41.2866, 174.7756], 13);

    // Add the Esri Vector Basemap layer
    const apiKey = "API KEY REQUIRED";
    const basemapEnum = "b6748ab300af448db21ea90956d29949";
    L.esri.Vector.vectorBasemapLayer(basemapEnum, {
        apiKey: apiKey,
    }).addTo(map);

    // LINE - Road Classification
    const featureLayerUrl2 = "https://gis.wcc.govt.nz/arcgis/rest/services/DistrictPlanProposed/DistrictPlanProposed/MapServer/30";

    // Fetch metadata first
    L.esri.get(featureLayerUrl2, {}, function (error, response) {
        if (!error) {
            const drawingInfo = response.drawingInfo;

            // Use the existing featureLayer2 variable
            featureLayer2 = L.esri.featureLayer({
                url: featureLayerUrl2,
                style: function (feature) {
                    // Extract the symbol information from the unique value renderer
                    const uniqueValueInfos = drawingInfo.renderer.uniqueValueInfos;

                    // Find the matching unique value info based on the field value in your data
                    const fieldValue = feature.properties.current_st; // Adjust this based on your data
                    const matchingInfo = uniqueValueInfos.find(info => info.value === fieldValue);

                    // Use the symbol information to style the line
                    if (matchingInfo) {
                        return {
                            color: `rgb(${matchingInfo.symbol.color.join(',')})`,
                            weight: matchingInfo.symbol.width
                        };
                    } else {
                        // Provide a default style if no match is found
                        return { color: 'black', weight: 1 };
                    }
                }
            }).addTo(map);

            // Bring the labels layer to the front to make sure it's above other layers
            featureLayer2.on('add', function () {
                cartoDBLabelsLayer.bringToFront();
            });

            // Call updateLegend after featureLayer2 is created
            updateLegend();
        } else {
            console.error("Error fetching metadata:", error);
        }
    });

    // Add the second basemap layer (CartoDB_PositronOnlyLabels)
    const cartoDBLabelsLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 20,
        opacity: 1, // Set the opacity of the labels
        pane: 'labels'
    }).addTo(map);

    // Add a legend control
    const legendControl = L.Control.extend({
        options: {
            position: 'topright'
        },
        onAdd: function () {
            const container = L.DomUtil.create('div', 'legend-control');
            container.innerHTML = '<button id="legend-button">L</button><div id="legend-content" style="display:none;"></div>';
            return container;
        }
    });

    // Function to close the legend when clicking on the map
    map.on('click', function () {
        const legendContentDiv = document.getElementById('legend-content');
        legendContentDiv.style.display = 'none';
    });

    // Set up the event listener for the button
    document.getElementById('legend-button').addEventListener('click', toggleLegend);
});
