import * as React from 'react';

/**
 * Hook to set the document title and restore the original title on unmount
 * @param title The title to set for the document
 *
 * @example
 * useDocumentTitle('My Page Title');
 */
export function useDocumentTitle(title: string): void {
	const originalTitleRef = React.useRef(document.title);

	React.useEffect(() => {
		document.title = title;
	}, [title]);

	React.useEffect(() => {
		const originalTitle = originalTitleRef.current;
		return () => {
			document.title = originalTitle;
		};
	}, []);
}
