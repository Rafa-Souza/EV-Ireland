import React, {Component} from 'react';
import {render} from 'react-dom';
import {StaticMap} from 'react-map-gl';
import {HexagonLayer} from '@deck.gl/aggregation-layers';
import DeckGL from '@deck.gl/react';
import DatePicker from "react-datepicker";

import "react-datepicker/dist/react-datepicker.css";
import './main.css';

const MAPBOX_TOKEN = process.env.MapboxAccessToken; // eslint-disable-line
const API_URL = 'http://localhost:5000/'
const DATA_URL = API_URL + 'charge_points'; // eslint-disable-line
const DATE_INTERVAL_URL = API_URL + 'date_interval'; // eslint-disable-line

const INITIAL_VIEW_STATE = {
  longitude: -8.5,
  latitude: 52.9,
  zoom: 7,
  minZoom: 5,
  maxZoom: 15,
  pitch: 40.5,
  bearing: -27.396674584323023
};

const filterMenuStyle = {
    backgroundColor: "#333",
    top: "0px",
    bottom: "0px",
    left: "0px",
    height: "100%",
    width: "240px",
    padding: "24px",
    position: "absolute",
    zIndex: 1,
    borderRight: "1px solid black"
};

const hoverStyle = {
    position: 'absolute',
    zIndex: 1,
    pointerEvents: 'none',
    cursor: "default !important",
    backgroundColor: "#333",
    border: "1px solid black",
    color: "white",
    padding: "24px"
}

const colorRange = [
    [1, 152, 189],
    [73, 227, 206],
    [216, 254, 181],
    [254, 237, 177],
    [254, 173, 84],
    [209, 55, 78]
  ];

/* eslint-disable react/no-deprecated */
export class App extends Component {

    constructor(props) {
        super(props);
        this.state = {
            elevationScale: 150,
            radius: 100,
            data: [],
            filteredData: [],
            chargeTypes: {
                isStandardType2: {
                    checked: true,
                    value: "StandardType2"
                },
                isServices: {
                    checked: true,
                    value: "Services" 
                },
                isComboCCS: {
                    checked: true,
                    value: "ComboCCS" 
                },
                isFastAC43: {
                    checked: true,
                    value: "FastAC43" 
                },
                isCHAdeMO: {
                    checked: true,
                    value: "CHAdeMO" 
                }
            },
            minDate: null,
            maxDate: null,
            startDate: new Date(),
            endDate: new Date(),
            startTime: new Date().setHours(0,0),
            endTime: new Date().setHours(23,59),
            hoveredObject: null,
            pointerX: 0,
            pointerY: 0
        };
    }

    componentDidMount() {
        this._getMinMaxDate();
        this._processData();
    }

    _getMinMaxDate() {
        fetch(DATE_INTERVAL_URL).then(response => {
            response.json().then(data => {
                this.setState({
                    minDate:  new Date(data.min),
                    maxDate:  new Date(data.max)
                });
            });
        })
        .catch(function(error) {
            console.log('There has been a problem with your fetch operation: ' + error.message);
        });
    }

    _processData() {
        fetch(DATA_URL).then(response => {
            response.json().then(data => {
                this.setState({
                    data 
                });
                this._filterChargeTypes(null, this);
            });
        })
        .catch(function(error) {
            console.log('There has been a problem with your fetch operation: ' + error.message);
        });
    };

    _renderTooltip() {
        const {hoveredObject, pointerX, pointerY} = this.state || {};
        return hoveredObject && (
            <div style={{...hoverStyle, left: pointerX, top: pointerY}}>
                <div className="charge-point-usage">Average Usage: {hoveredObject.elevationValue.toFixed(1)}%</div>
                <div className="charge-point-address">Address: {hoveredObject.points[0].address}</div>
                <br/>
                <table className="stats-table">
                    <thead>
                        <tr>
                            <th>Charging Type</th>
                            <th>FO</th>
                            <th>PO</th>
                            <th>OOS</th>
                            <th>OOC</th>
                        </tr>
                    </thead>
                    <tbody>
                        {this._mountStats(hoveredObject.points)}
                    </tbody>
                </table>
            </div>
        );
    }

    _mountStats(points) {
        return points.map((point, key) => {
            return (<tr className="charge-type-card" key={key}>
                <td>{ point.charge_point_type }</td>
                <td>{ ((point.total_occ/288) * 100).toFixed(1) }%</td>
                <td>{ ((point.total_part/288) * 100).toFixed(1) }%</td>
                <td>{ ((point.total_oos/288) * 100).toFixed(1) }%</td>
                <td>{ ((point.total_ooc/288) * 100).toFixed(1) }%</td>
            </tr>)
        })
    }

    _renderMenuStatusTable() {
        return (
            <div>
                <table className="menu-status-table">
                    <caption><b>Status Description</b></caption>
                    <tbody>
                        <tr>
                            <td>FO</td>
                            <td>Fully Occupied</td>
                        </tr>
                        <tr>
                            <td>PO</td>
                            <td>Partially Occupied</td>
                        </tr>
                        <tr>
                            <td>OOS</td>
                            <td>Out of Service</td>
                        </tr>
                        <tr>
                            <td>OOC</td>
                            <td>Out of Contact</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        )
    }

    _renderLegend() {
        return (
            <div className="menu-legend">
                <div className="legend"><b>Legend</b></div>
                <div className="bars">
                    <div className="bar" style={{backgroundColor: "rgb(1, 152, 189)", height: "5px"}}></div>
                    <div className="bar" style={{backgroundColor: "rgb(73, 227, 206)", height: "10px"}}></div>
                    <div className="bar" style={{backgroundColor: "rgb(216, 254, 181)", height: "15px"}}></div>
                    <div className="bar" style={{backgroundColor: "rgb(254, 237, 177)", height: "25px"}}></div>
                    <div className="bar" style={{backgroundColor: "rgb(254, 173, 84)", height: "40px"}}></div>
                    <div className="bar" style={{backgroundColor: "rgb(209, 55, 78)", height: "60px"}}></div>
                </div>
                <div className="subtitle">
                    <div className="subtitle-1">Low</div>
                    <div className="subtitle-2">Usage (%)</div>
                    <div className="subtitle-3">High</div>
                </div>
            </div>
        )
    }

    _filterChargeTypes(chargeType, self) {
        if(chargeType){
            self.state.chargeTypes[chargeType].checked = !self.state.chargeTypes[chargeType].checked;
        }
        let chargeTypesToInclude = Object.values(self.state.chargeTypes).reduce((array, ct) => {
            return ct.checked ? array.concat(ct.value) : array
        },[]);
        let filteredData = self.state.data.filter((point) => {
            return chargeTypesToInclude.includes(point.charge_point_type);
        });
        self.setState({filteredData})
    }

    _renderChargeTypes() {
        return (
        <div className="menu-types">
            <div className="title"><b>Charge Point Types</b></div>
            <div className="charge-type-checkboxes">
                <label>
                    <input type="checkbox" checked={this.state.chargeTypes.isStandardType2.checked} onChange={(e) => {this._filterChargeTypes("isStandardType2", this)}}/>StandardType2
                </label>
                <label>
                    <input type="checkbox" checked={this.state.chargeTypes.isServices.checked} onChange={(e) => {this._filterChargeTypes("isServices", this)}}/>Services
                </label>
                <label>
                    <input type="checkbox" checked={this.state.chargeTypes.isComboCCS.checked} onChange={(e) => {this._filterChargeTypes("isComboCCS", this)}}/>ComboCCS
                </label>
                <label>
                    <input type="checkbox" checked={this.state.chargeTypes.isFastAC43.checked} onChange={(e) => {this._filterChargeTypes("isFastAC43", this)}}/>FastAC43
                </label>
                <label>
                    <input type="checkbox" checked={this.state.chargeTypes.isCHAdeMO.checked} onChange={(e) => {this._filterChargeTypes("isCHAdeMO", this)}}/>CHAdeMOL
                </label>
            </div>
        </div>
        )
    }

    _renderFilterTable() {
        return (
            <table>
                <thead>
                    <tr>
                        <th></th>
                        <th>From</th>
                        <th>To</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Date:</td>
                        <td>
                        <DatePicker
                            selected={this.state.startDate}
                            onChange={date => this.setState({startDate: date})}
                            minDate={this.state.minDate}
                            maxDate={this.state.endDate}
                            dateFormat="dd/MM/yyyy"
                            showYearDropdown
                            dropdownMode="select"
                            selectsStart
                            isClearable
                            placeholderText="Select Date..."
                        />
                        </td>
                        <td>
                        <DatePicker
                            selected={this.state.endDate}
                            onChange={date => this.setState({endDate: date})}
                            minDate={this.state.startDate}
                            maxDate={this.state.maxDate}
                            dateFormat="dd/MM/yyyy"
                            showYearDropdown
                            dropdownMode="select"
                            selectsEnd
                            isClearable
                            placeholderText="Select Date..."
                        />
                        </td>
                    </tr>
                    <tr>
                        <td>Time:</td>
                        <td>
                        <DatePicker
                            selected={this.state.startTime}
                            onChange={time => this.setState({startTime: time})}
                            isClearable
                            placeholderText="Select Time..."
                            showTimeSelect
                            showTimeSelectOnly
                            timeIntervals={15}
                            timeCaption="Time"
                            dateFormat="HH:mm"
                            timeFormat="HH:mm"
                        />
                        </td>
                        <td>
                        <DatePicker
                            selected={this.state.endTime}
                            onChange={time => this.setState({endTime: time})}
                            isClearable
                            placeholderText="Select Time..."
                            showTimeSelect
                            showTimeSelectOnly
                            timeIntervals={15}
                            timeCaption="Time"
                            dateFormat="HH:mm"
                            timeFormat="HH:mm"
                        />
                        </td>
                    </tr>
                </tbody>
            </table>
        )
    }

    _customElevationCalc(points) {
        let avg_occ = points.reduce((sum,point) => sum + point.total_occ + (point.total_part/2), 0)/points.length;
        return (avg_occ/288) * 100
    }

    _onZoom(viewObj) {
        if(viewObj.interactionState.isZooming){
            if(viewObj.oldViewState.zoom < viewObj.viewState.zoom){
                this.setState({elevationScale: this.state.elevationScale * 0.64, radius: this.state.radius* 0.8})
            }else{
                this.setState({elevationScale: this.state.elevationScale * 1.5625, radius: this.state.radius* 1.25})
            }
        }
    }

    _renderLayers() {
        const {upperPercentile = 100, coverage = 1} = this.props;

        return [
            new HexagonLayer({
                id: 'heatmap',
                colorRange,
                coverage,
                data: this.state.filteredData,
                elevationScale: this.state.elevationScale,
                elevationRange: [0, 100],
                extruded: true,
                getPosition: d => [Number(d.longitude), Number(d.latitude)],
                getColorValue : this._customElevationCalc,
                getElevationValue: this._customElevationCalc,
                onHover: info => this.setState({
                    hoveredObject: info.object,
                    pointerX: info.x,
                    pointerY: info.y
                }),
                opacity: 1,
                pickable: true,
                radius: this.state.radius,
                upperPercentile,
                transitions: {
                    elevationScale: 3000
                }
            })
        ];
    }

    render() {
        const {mapStyle = 'mapbox://styles/mapbox/dark-v9'} = this.props;

        return (
            <div>
                <div id="menu" style={filterMenuStyle}>
                    <div className="menu-title">
                        <h3 className="gold-text">Average Usage per EV Charging Point Over a Period of Time</h3>
                        <p>Which EV Charging Points are most often in use in Ireland?</p>
                    </div>
                    <hr/>
                    {this._renderMenuStatusTable()}
                    <hr/>
                    {this._renderLegend()}
                    <hr/>
                    <div className="menu-filter">
                        {this._renderFilterTable()}
                        <button className="filter-btn">Filter Dataset</button>
                    </div>
                    <hr/>
                    {this._renderChargeTypes()}
                </div>
                <DeckGL
                    layers={this._renderLayers()}
                    initialViewState={INITIAL_VIEW_STATE}
                    controller={true}
                >
                    <StaticMap
                    reuseMaps
                    mapStyle={mapStyle}
                    preventStyleDiffing={true}
                    mapboxApiAccessToken={MAPBOX_TOKEN}
                    />
                </DeckGL>
                { this._renderTooltip() }
            </div>
        
        );
    }
}

export function renderToDOM(container) {
  render(<App />, container);
}
