import React from 'react';

interface ContainerProps {
	title?: string,
	children?: React.ReactNode
}

const Container = (props: ContainerProps) => {
	const title = props.title ? <h1 id='pageTitle'>{props.title}</h1> : null;

	return (
      	<div id='container' className='ui container pt-3'>
			{title}
			{props.children}
		</div>
		
	)
};

export default Container;