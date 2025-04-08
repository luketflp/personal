import React, { useState, useEffect } from 'react';

const TerminalTyping = ({ 
  text = "Lucas Alexander", 
  typingSpeed = 150,
  erasingSpeed = 75,
  pauseBeforeErasing = 2000,
  pauseBeforeRetyping = 500,
  cursorBlinkSpeed = 530,
  textColor = "black",
  fontSize = "md",
  showBorder = true,
  showShadow = true,
  cursorChar = "█",
  prefix = "> "
}) => {
  const [displayText, setDisplayText] = useState('');
  const [showCursor, setShowCursor] = useState(true);
  const [phase, setPhase] = useState('typing'); // 'typing', 'erasing', 'pauseBeforeErasing', 'pauseBeforeRetyping'
  
  // Main effect to handle the animation cycle
  useEffect(() => {
    let timeout: NodeJS.Timeout;
    
    // Phase 1: Typing
    if (phase === 'typing') {
      if (displayText.length < text.length) {
        timeout = setTimeout(() => {
          setDisplayText(text.substring(0, displayText.length + 1));
        }, typingSpeed);
      } else {
        // Finished typing, now pause before erasing
        setPhase('pauseBeforeErasing');
      }
    } 
    // Phase 2: Pause after typing
    else if (phase === 'pauseBeforeErasing') {
      timeout = setTimeout(() => {
        setPhase('erasing');
      }, pauseBeforeErasing);
    }
    // Phase 3: Erasing
    else if (phase === 'erasing') {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText(prevText => prevText.substring(0, prevText.length - 1));
        }, erasingSpeed);
      } else {
        // Finished erasing, now pause before retyping
        setPhase('pauseBeforeRetyping');
      }
    }
    // Phase 4: Pause after erasing
    else if (phase === 'pauseBeforeRetyping') {
      timeout = setTimeout(() => {
        setPhase('typing');
      }, pauseBeforeRetyping);
    }
    
    return () => clearTimeout(timeout);
  }, [displayText, text, phase, typingSpeed, erasingSpeed, pauseBeforeErasing, pauseBeforeRetyping]);
  
  // Blinking cursor effect
  useEffect(() => {
    const cursorTimer = setInterval(() => {
      setShowCursor(prev => !prev);
    }, cursorBlinkSpeed);
    
    return () => clearInterval(cursorTimer);
  }, [cursorBlinkSpeed]);

  // Generate border and shadow classes based on props
  const borderClass = showBorder ? 'border border-gray-200' : '';
  const shadowClass = showShadow ? 'shadow-sm' : '';
  
  return (
    <span className={`text-${textColor} font-bold text-${fontSize} flex items-center whitespace-nowrap`} style={{ color: textColor.startsWith('#') ? textColor : undefined }}>
      {prefix}{displayText}
      <span className={`${showCursor ? 'opacity-100' : 'opacity-0'} transition-opacity duration-100 inline-block align-middle`}>
        {cursorChar}
      </span>
    </span>
  );
};

export default TerminalTyping;