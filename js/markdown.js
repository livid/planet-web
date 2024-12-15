/**
 * Adds markdown autocomplete behavior to a textarea
 * @param {HTMLTextAreaElement} textarea - The textarea element to enhance
 * @param {Object} options - Configuration options
 * @param {string[]} [options.listMarkers=['- ', '* ', '+ ']] - List markers to support
 * @param {boolean} [options.supportNumberedLists=false] - Whether to support numbered lists
 * @param {boolean} [options.supportTaskLists=true] - Whether to support task lists (- [ ])
 * @param {Function} [options.onSubmit] - Callback function when Cmd/Ctrl + Enter is pressed
 * @returns {function} Cleanup function to remove the event listeners
 */
function addMarkdownAutocomplete(textarea, options = {}) {
  const defaultOptions = {
    listMarkers: ['- ', '* ', '+ '],
    supportNumberedLists: false,
    supportTaskLists: true,
    onSubmit: () => console.log('Submit pressed')
  };
  
  const config = { ...defaultOptions, ...options };
  
  function handleKeydown(e) {
    // Handle Cmd/Ctrl + Enter
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      config.onSubmit(textarea.value);
      textarea.removeEventListener('keydown', handleKeydown);
      return;
    }
    
    // Original Enter key handling
    if (e.key === 'Enter' && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      
      const value = textarea.value;
      const selectionStart = textarea.selectionStart;
      
      // Get the current line before cursor
      const beforeCursor = value.substring(0, selectionStart);
      const lines = beforeCursor.split('\n');
      const currentLine = lines[lines.length - 1];
      
      // Get the text after cursor
      const afterCursor = value.substring(selectionStart);
      
      // Check for task list markers
      const taskListMatch = config.supportTaskLists ? 
        currentLine.match(/^(\s*)-\s*\[([ x])\]\s*/) : null;
      
      // Check for list markers if not a task list
      let listMarker = '';
      let isNumberedList = false;
      
      if (taskListMatch) {
        const [, indent] = taskListMatch;
        // Always use unchecked checkbox for new tasks
        listMarker = `${indent}- [ ] `;
      } else {
        // Check unordered list markers
        const unorderedMarkerMatch = currentLine.match(
          new RegExp(`^(\\s*)(${config.listMarkers.map(m => escapeRegExp(m)).join('|')})`)
        );
        
        // Check numbered list if enabled
        const numberedMarkerMatch = config.supportNumberedLists ? 
          currentLine.match(/^(\s*)(\d+\.\s+)/) : null;
        
        if (unorderedMarkerMatch) {
          const [, indent, marker] = unorderedMarkerMatch;
          listMarker = indent + marker;
        } else if (numberedMarkerMatch) {
          const [, indent, marker] = numberedMarkerMatch;
          listMarker = indent;
          isNumberedList = true;
        }
      }
      
      if (listMarker || isNumberedList) {
        // If line only contains the list marker, remove it
        const isEmptyTaskList = taskListMatch && currentLine.trim() === '- [ ]';
        const isEmptyList = currentLine.trim() === listMarker.trim() || 
          (isNumberedList && currentLine.trim().match(/^\d+\.\s*$/));
          
        if (isEmptyTaskList || isEmptyList) {
          lines[lines.length - 1] = '';
          textarea.value = lines.join('\n') + '\n' + afterCursor;
          textarea.selectionStart = textarea.selectionEnd = 
            beforeCursor.length - listMarker.length + 1;
        } 
        // Otherwise, add list marker to new line
        else {
          let newMarker = listMarker;
          if (isNumberedList) {
            // Extract number and increment
            const currentNumber = parseInt(currentLine.match(/^\s*(\d+)/)[1]);
            newMarker += `${currentNumber + 1}. `;
          }
          textarea.value = beforeCursor + '\n' + newMarker + afterCursor;
          textarea.selectionStart = textarea.selectionEnd = 
            selectionStart + 1 + newMarker.length;
        }
      } 
      // No list marker, just add new line
      else {
        textarea.value = beforeCursor + '\n' + afterCursor;
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 1;
      }
    }
  }
  
  // Helper function to escape special regex characters
  function escapeRegExp(string) {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  
  // Add event listener
  textarea.addEventListener('keydown', handleKeydown);
  
  // Return cleanup function
  return () => textarea.removeEventListener('keydown', handleKeydown);
}

export { addMarkdownAutocomplete };