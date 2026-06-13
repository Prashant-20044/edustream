import { useContext, useEffect, useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import { SocketContext } from '../context/SocketContext';
import VideoStream from '../components/VideoStream';
import Whiteboard from '../components/Whiteboard';
import ChatBox from '../components/ChatBox';
import './LiveClassRoom.css';

const LiveClassRoom = () => {
  const { classId } = useParams();
  const { user } = useContext(AuthContext);
  const { socket } = useContext(SocketContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [classTopic, setClassTopic] = useState(location.state?.topic || 'Live Class');
  const [classMaterials, setClassMaterials] = useState(location.state?.classData?.materials || []);
  const [isGeneratingNotes, setIsGeneratingNotes] = useState(false);
  const [materialsError, setMaterialsError] = useState('');

  // If a teacher started this from dashboard, state will have isTeacher = true
  // Otherwise we infer from the logged in user's role
  const isTeacher = location.state?.isTeacher || user?.role === 'teacher';

  useEffect(() => {
    if (!user) {
      navigate('/');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!socket || isTeacher) return;

    const handleStreamEnded = () => {
      alert('The teacher has ended this class.');
      navigate('/student', { replace: true });
    };

    socket.on('stream-ended', handleStreamEnded);

    return () => {
      socket.off('stream-ended', handleStreamEnded);
    };
  }, [socket, isTeacher, navigate]);

  const handleLeaveOrEnd = async () => {
    if (isTeacher) {
      try {
        await axios.patch(`/api/classes/${classId}/end`);
      } catch (err) {
        console.error('Failed to end class:', err);
      }
      navigate('/teacher', { replace: true });
    } else {
      navigate('/student', { replace: true });
    }
  };

  useEffect(() => {
    if (!user) return;

    const fetchClass = async () => {
      try {
        const res = await axios.get(`/api/classes/${classId}`);
        if (res.data.success) {
          setClassTopic(res.data.class.topic);
          setClassMaterials(res.data.class.materials || []);
        }
      } catch (err) {
        console.error('Could not load class details:', err);
      }
    };

    fetchClass();
  }, [classId, user]);

  useEffect(() => {
    if (!socket) return undefined;

    const handleMaterialSaved = (material) => {
      setClassMaterials((current) => {
        if (current.some((item) => item.publicId === material.publicId || item.url === material.url)) {
          return current;
        }
        return [...current, material];
      });
    };

    socket.on('whiteboard-snapshot-saved', handleMaterialSaved);
    socket.on('whiteboard-notes-generated', handleMaterialSaved);

    return () => {
      socket.off('whiteboard-snapshot-saved', handleMaterialSaved);
      socket.off('whiteboard-notes-generated', handleMaterialSaved);
    };
  }, [socket]);

  const handleSnapshotSaved = (material) => {
    setClassMaterials((current) => [...current, material]);
  };

  const handleGenerateNotesPdf = async () => {
    if (!isTeacher || isGeneratingNotes) return;

    setIsGeneratingNotes(true);
    setMaterialsError('');

    try {
      const res = await axios.post(`/api/upload/whiteboard-notes/${classId}`);
      if (res.data.success) {
        setClassMaterials((current) => [...current, res.data.material]);
        socket?.emit('whiteboard-notes-generated', classId, res.data.material);
      }
    } catch (err) {
      setMaterialsError(err.response?.data?.message || 'Could not generate PDF notes.');
    } finally {
      setIsGeneratingNotes(false);
    }
  };

  const whiteboardSnapshots = classMaterials.filter((material) => material.type === 'whiteboard-snapshot');
  const notesPdfs = classMaterials.filter((material) => (
    material.type === 'whiteboard-notes-pdf' || material.type === 'pdf'
  ));
  const shouldShowMaterials = whiteboardSnapshots.length > 0 || notesPdfs.length > 0 || isTeacher;

  if (!user) return null;

  return (
    <div className="classroom-layout">
      <header className="classroom-header glass-panel">
        <div className="header-left">
          <button className="btn-outline btn-sm" onClick={handleLeaveOrEnd}>
            {isTeacher ? 'End Class' : 'Leave'}
          </button>
          <h2>{classTopic}</h2>
        </div>
        <div className="header-right">
          <span className="role-badge">{isTeacher ? 'Broadcasting' : 'Viewing'}</span>
        </div>
      </header>

      <main className="classroom-main">
        <div className="left-panel">
          <div className="video-section">
            <VideoStream socket={socket} roomId={classId} isTeacher={isTeacher} user={user} topic={classTopic} />
          </div>
          <div className="chat-section">
            <ChatBox socket={socket} roomId={classId} user={user} />
          </div>
        </div>

        <div className="right-panel">
          <Whiteboard
            socket={socket}
            roomId={classId}
            isTeacher={isTeacher}
            onSnapshotSaved={handleSnapshotSaved}
          />

          {shouldShowMaterials && (
            <section className="class-materials-panel glass-panel" aria-label="Saved whiteboards">
              <div className="materials-heading">
                <h3>Class notes</h3>
                <span>{whiteboardSnapshots.length}</span>
              </div>
              {isTeacher && (
                <button
                  className="btn-primary btn-full generate-notes-btn"
                  onClick={handleGenerateNotesPdf}
                  disabled={isGeneratingNotes || whiteboardSnapshots.length === 0}
                  type="button"
                >
                  {isGeneratingNotes ? 'Generating PDF...' : 'Generate PDF Notes'}
                </button>
              )}
              {materialsError && <div className="materials-error">{materialsError}</div>}
              {notesPdfs.length > 0 && (
                <div className="notes-download-list">
                  {notesPdfs.map((material, index) => (
                    <a
                      key={material.publicId || material.url || index}
                      className="notes-download-link"
                      href={material.url}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <span>PDF</span>
                      {material.filename || `Whiteboard notes ${index + 1}`}
                    </a>
                  ))}
                </div>
              )}
              <div className="materials-list">
                {whiteboardSnapshots.map((material, index) => (
                  <a
                    key={material.publicId || material.url || index}
                    className="material-link"
                    href={material.url}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <img src={material.url} alt={material.filename || `Whiteboard snapshot ${index + 1}`} />
                    <span>{material.filename || `Snapshot ${index + 1}`}</span>
                  </a>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </div>
  );
};

export default LiveClassRoom;
