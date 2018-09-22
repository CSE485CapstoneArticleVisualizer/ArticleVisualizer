import vis from 'vis';

var nodes = new vis.DataSet([
    {id: 1, label: 'Computer Science'},
    {id: 2, label: 'Neurology'},
    {id: 3, label: 'Eurology'},
    {id: 4, label: 'China'},
    {id: 5, label: 'Japan'}
]);

// create an array with edges
var edges = new vis.DataSet([
    {from: 1, to: 3},
    {from: 1, to: 2},
    {from: 2, to: 4},
    {from: 2, to: 5}
]);

// create a network
var container = document.getElementById('mynetwork');

// provide the data in the vis format
var data = {
    nodes: nodes,
    edges: edges
};
var options = {};

// initialize your network!
var network = new vis.Network(container, data, options);