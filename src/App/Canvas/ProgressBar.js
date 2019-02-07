import React, { Component } from 'react';
import './ProgressBar.css';

class ProgressBar extends Component {
	render() {
		const totalWidth = window.innerWidth
		const currentWidth = this.props.percent * totalWidth;

		return (
			<div className='progress-bar-container'>
				<div className='progress-bar' style={{width: currentWidth}}/>
				<div className='progress-bar-spinner-container'>
					<div className='progress-bar-spinner-icon'/>
				</div>
			</div>
		)
	}
}

export default ProgressBar;