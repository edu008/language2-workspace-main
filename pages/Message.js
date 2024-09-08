import React from 'react';

function Message(props) {
  if (props.message === "Erfolgreich hinzugefügt!") {
    return (
      <div className="text-green-600 pt-5 text-xl">
        {props.message}
      </div>
    );
  } else {
    return (
      <div className="text-red-600 pt-5 text-xl">
        {props.message}
      </div>
    );
  }
}

export default Message;