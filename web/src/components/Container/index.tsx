import React from 'react';

interface ContainerProps {
	title?: string,
	children?: React.ReactNode
}

const Container = (props: ContainerProps) => {
	const title = props.title ? <h1>{props.title}</h1> : null;

	return (
      	<div className='ui container pt-3'>
			{title}
			{props.children}
		</div>
		
	)
};

export default Container;