import './App.css';
import { useState, useEffect } from 'react';
import FileViewer from './components/FileViewer';
import FileExplorer from './components/FileExplorer';
import FileUploadPage from './components/FileUploadPage';
import Footer from './components/Footer';
import Navbar from './components/Navbar';

import LoginComponent from './components/LoginComponent';
import SignupComponent from './components/SignUpComponent';
import { Box, Typography, Dialog, DialogTitle, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import './config/axiosConfig';
import WelcomePage from './components/WelcomePage';
import { useTheme } from '@mui/material/styles';
import ResizablePanels from './components/ResizablePanel';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [showSignup, setShowSignup] = useState(false);
  const [selectedFolderId, setSelectedFolderId] = useState(null);
  const [openedFile, setOpenedFile] = useState({ fileName: null, content: null });
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [userFullName, setUserFullName] = useState(null);
  const theme = useTheme();
  useEffect(() => {
    const token = localStorage.getItem('authToken');
    const storedFullName = localStorage.getItem('userFullName');
    if (token) {
      setIsLoggedIn(true);
      setUserFullName(storedFullName);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsLoggedIn(true);
    setShowLogin(false);
    const storedFullName = localStorage.getItem('userFullName');
    setUserFullName(storedFullName);
  };

  const handleSignupSuccess = () => {
    alert('Üyeliğiniz başarıyla oluşturuldu! Lütfen giriş yapın.');
    setShowSignup(false);
    setShowLogin(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userFullName');
    setUserFullName(null);
    setOpenedFile({ fileName: null, content: null });
    setSelectedFolderId(null);
    setShowUploadModal(false);
    setIsLoggedIn(false);

    setOpenedFile({ fileName: null, content: null });
    setSelectedFolderId(null);
  };

  const handleOpenFileContent = (fileName, content) => {
    setOpenedFile({ fileName, content });
  };

  const handleSelectFolder = (folderId) => {
    setSelectedFolderId(folderId);
  };

  const handleOpenUploadModal = () => {
    setShowUploadModal(true);
  };

  const handleCloseUploadModal = () => {
    setShowUploadModal(false);
    setSelectedFolderId(null);
  };

  const handleUploadSuccessAndCloseModal = () => {
    setShowUploadModal(false);
    setSelectedFolderId(null);
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', paddingTop: '1px' }}>
      <Navbar
        onShowUpload={handleOpenUploadModal}
        onShowLogin={() => { setShowLogin(true); setShowSignup(false); }}
        onShowSignup={() => { setShowSignup(true); setShowLogin(false); }}
        isLoggedIn={isLoggedIn}
        onLogout={handleLogout}
        userFullName={userFullName}
      />

      {isLoggedIn && (
        <ResizablePanels
          sx={{ flexGrow: 1, paddingTop: '64px', maxHeight: 'calc(100vh - 64px)' }}
          leftPanel={
            <FileExplorer
              onOpenFileContent={handleOpenFileContent}
              onSelectFolder={handleSelectFolder}
            />
          }
          rightPanel={
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `linear-gradient(135deg, ${theme.palette.primary.main} 10%, ${theme.palette.secondary.dark} 100%)`,
                width: '100%',
                height: '100%',
              }}
            >
              {openedFile.fileName ? (
                <FileViewer fileName={openedFile.fileName} content={openedFile.content} />
              ) : (
                <Box
  sx={{
    position: 'relative',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  }}
>
  <Box
    sx={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundImage: 'url("/background.jpg")',
      backgroundSize: 'cover',
      backgroundRepeat: 'no-repeat',
      backgroundPosition: 'center',
      opacity: 0.55,
      zIndex: 0,
    }}
  />

  <Box
    sx={{
      position: 'relative',
      zIndex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      textAlign: 'center',
      color: '#fff',
      padding: 4,
    }}
  >
                  <Box sx={{ fontSize: 64, mb: 2 }}>📂</Box>
                  <Typography variant="h5" gutterBottom>
                    Henüz bir dosya seçmediniz
                  </Typography>
                  <Typography variant="body1">
                    Sol taraftaki dosya gezgininden bir dosya seçin veya yukarıdan yeni bir dosya yükleyin.
                  </Typography>
                </Box>
                </Box>
              )}
            </Box>
          }
        />
      )}

      {!isLoggedIn && (
        <Box
          sx={{
            flexGrow: 1,
            paddingTop: '64px',
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 10%, ${theme.palette.secondary.dark} 100%)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {showLogin && (
            <LoginComponent
              onLoginSuccess={handleLoginSuccess}
              onClose={() => setShowLogin(false)}
            />
          )}
          {showSignup && (
            <SignupComponent
              onSignupSuccess={handleSignupSuccess}
              onClose={() => setShowSignup(false)}
            />
          )}
          {!showLogin && !showSignup && (
            <WelcomePage
              onShowLogin={() => { setShowLogin(true); setShowSignup(false); }}
              onShowSignup={() => { setShowSignup(true); setShowLogin(false); }}
            />
          )}
        </Box>

      )}

      <Footer />
      {isLoggedIn && (
        <Dialog open={showUploadModal} onClose={handleCloseUploadModal} fullWidth maxWidth="sm">
          <DialogTitle>
            Dosya Yükle
            <IconButton
              aria-label="close"
              onClick={handleCloseUploadModal}
              sx={{ position: 'absolute', right: 8, top: 8 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent dividers>
            <FileUploadPage
              folderId={selectedFolderId}
              onUploadSuccess={handleUploadSuccessAndCloseModal}
            />
          </DialogContent>
        </Dialog>
      )}
    </Box>
  );
}

export default App;