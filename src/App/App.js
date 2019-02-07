import React, { Component } from 'react';
import Visualizer from './Canvas/Visualizer'

import './App.css';
import 'semantic-ui-css/semantic.min.css';

class App extends Component {
	render() {
		return (
			<div>
				<Visualizer/>
			</div>
		);
	}
}

export default App;
