import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { UploadPage } from '@/pages/UploadPage';
import { ReviewPage } from '@/pages/ReviewPage';
import { AdminPage } from '@/pages/AdminPage';
import { TestPage } from '@/pages/TestPage';

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<UploadPage />} />
        <Route path="/review/:token" element={<ReviewPage />} />
        <Route path="/admin/:docId" element={<AdminPage />} />
        <Route path="/tests" element={<TestPage />} />
        <Route path="*" element={<UploadPage />} />
      </Routes>
    </Router>
  );
}
