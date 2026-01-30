import { useEffect, useState } from "react";
import "./App.css";
import io from "socket.io-client";
import Editor from "@monaco-editor/react";
import { v4 as uuid } from "uuid";

const socket = io("https://collaborative-code-editor-ki2f.onrender.com");

const App = () => {
  const [joined, setJoined] = useState(false);
  const [roomId, setRoomId] = useState("");
  const [userName, setUserName] = useState("");
  const [language, setLanguage] = useState("javascript");
  const [code, setCode] = useState("// start code here");
  const [copySuccess, setCopySuccess] = useState("");
  const [users, setUsers] = useState([]);
  const [typing, setTyping] = useState("");
  const [outPut, setOutPut] = useState("");
  const [version, setVersion] = useState("*");

  useEffect(() => {
    socket.on("userJoined", (users) => {
      setUsers(users);
    });

    socket.on("codeUpdate", (newCode) => {
      setCode(newCode);
    });

    socket.on("userTyping", (user) => {
      setTyping(`${user.slice(0, 8)}... is Typing`);
      setTimeout(() => setTyping(""), 2000);
    });

    socket.on("languageUpdate", (newLanguage) => {
      setLanguage(newLanguage);
    });

    socket.on("codeResponse", (response) => {
      setOutPut(response.run.output);
    });

    return () => {
      socket.off("userJoined");
      socket.off("codeUpdate");
      socket.off("userTyping");
      socket.off("languageUpdate");
      socket.off("codeResponse");
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = () => {
      socket.emit("leaveRoom");
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  const joinRoom = () => {
    if (roomId && userName) {
      socket.emit("join", { roomId, userName });
      setJoined(true);
    }
  };

  const leaveRoom = () => {
    socket.emit("leaveRoom");
    setJoined(false);
    setRoomId("");
    setUserName("");
    setCode("// start code here");
    setLanguage("javascript");
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopySuccess("Copied!");
    setTimeout(() => setCopySuccess(""), 2000);
  };

  const handleCodeChange = (newCode) => {
    setCode(newCode);
    socket.emit("codeChange", { roomId, code: newCode });
    socket.emit("typing", { roomId, userName });
  };

  const handleLanguageChange = (e) => {
    const newLanguage = e.target.value;
    setLanguage(newLanguage);
    socket.emit("languageChange", { roomId, language: newLanguage });
  };

  const [userInput, setUserInput] = useState("");

  const runCode = () => {
    socket.emit("compileCode", {
      code,
      roomId,
      language,
      version,
      input: userInput,
    });
  };

  const createRoomId = () => {
    const roomId = uuid();
    setRoomId(roomId);
  };

  if (!joined) {
    return (
      <div className="join-container">
        <div className="join-form">
          <h1>Code Together</h1>
          <p className="subtitle">Collaborate in real-time</p>
          <div className="input-group">
            <label htmlFor="roomId">Room ID</label>
            <input
              id="roomId"
              type="text"
              placeholder="Enter or create a room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
          </div>
          <button className="create-id-btn" onClick={createRoomId}>
            Generate New Room ID
          </button>
          <div className="input-group">
            <label htmlFor="userName">Your Name</label>
            <input
              id="userName"
              type="text"
              placeholder="Enter your name"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
            />
          </div>
          <button
            className="join-btn"
            onClick={joinRoom}
            disabled={!roomId || !userName}
          >
            Join Room
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="editor-container">
      <div className="sidebar">
        <div className="room-info">
          <h2>Code Room: {roomId}</h2>
          <button onClick={copyRoomId} className="copy-button">
    
            <span>Copy Room ID</span>
          </button>
          {copySuccess && <span className="copy-success">{copySuccess}</span>}
        </div>
        <h3 className="section-title">Users in Room</h3>
        <ul className="users-list">
          {users.map((user, index) => (
            <li key={index}>{user.slice(0, 8)}...</li>
          ))}
        </ul>
        <p className="typing-indicator">{typing}</p>
        <select
          className="language-selector"
          value={language}
          onChange={handleLanguageChange}
        >
          <option value="javascript">JavaScript</option>
          <option value="python">Python</option>
          <option value="java">Java</option>
          <option value="cpp">C++</option>
        </select>
        <button className="leave-button" onClick={leaveRoom}>
          Leave Room
        </button>
      </div>

      <div className="editor-wrapper">
        <div className="editor-section">
          <Editor
            key={language}
            height="100%"
            defaultLanguage={language}
            language={language}
            value={code}
            onChange={handleCodeChange}
            theme="vs-dark"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              padding: { top: 16, bottom: 16 },
              scrollBeyondLastLine: false,
              wordWrap: "on",
            }}
          />
        </div>
        <div className="console-section">
          <div className="input-group">
            <label htmlFor="userInput">Input</label>
            <textarea
              id="userInput"
              className="input-console"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              placeholder="Enter input here (if needed)..."
            />
          </div>
          <button className="run-btn" onClick={runCode}>
            <span>▶</span>
            <span>Run Code</span>
          </button>
          <div className="output-group">
            <label htmlFor="output">Output</label>
            <textarea
              id="output"
              className="output-console"
              value={outPut}
              readOnly
              placeholder="Output will appear here..."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
