import { BrowserRouter, Routes, Route } from 'react-router-dom'
import ScrollToTop from './components/ScrollToTop'
import LandingPage from './pages/LandingPage'
import LoginPage from './pages/auth/LoginPage'
import RegisterPage from './pages/auth/RegisterPage'
import ActivatePage from './pages/auth/ActivatePage'
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage'
import FeedPage from './pages/FeedPage'
import ProfilePage from './pages/ProfilePage'
import DisplayPage from './pages/DisplayPage'
import LeaderboardPage from './pages/LeaderboardPage'
import DisplayCategoryPage from './pages/display/DisplayCategoryPage'
import DisplayManagementPage from './pages/display/DisplayManagementPage'
import DisplayUploadPage from './pages/display/DisplayUploadPage'
import SettingsPage from './pages/SettingsPage'
import MyArticlePage from './pages/article/MyArticlePage'
import ArticleUploadPage from './pages/article/ArticleUploadPage'
import OpinionUploadPage from './pages/article/OpinionUploadPage'
import VignetteUploadPage from './pages/article/VignetteUploadPage'
import ArticleEditPage from './pages/article/ArticleEditPage'
import ArticleDetailPage from './pages/article/ArticleDetailPage'
import ArticlePage from './pages/ArticlePage'
import OpinionPage from './pages/OpinionPage'
import VignettePage from './pages/VignettePage'
import SessionExpiredModal from './components/SessionExpiredModal'

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <SessionExpiredModal />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/activate" element={<ActivatePage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/home" element={<FeedPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/profile/:userId" element={<ProfilePage />} />
        <Route path="/display" element={<DisplayPage />} />
        <Route path="/display/manage" element={<DisplayManagementPage />} />
        <Route path="/display/manage/new" element={<DisplayUploadPage />} />
        <Route path="/display/manage/:pubId" element={<DisplayUploadPage />} />
        <Route path="/display/:pubType" element={<DisplayCategoryPage />} />
        <Route path="/leaderboard" element={<LeaderboardPage />} />
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/articles/my"  element={<MyArticlePage />} />
        <Route path="/articles/new" element={<ArticleUploadPage />} />
        <Route path="/opinion/new" element={<OpinionUploadPage />} />
        <Route path="/vignette/new" element={<VignetteUploadPage />} />
        <Route path="/articles/:id/edit" element={<ArticleEditPage />} />
        <Route path="/articles/:id" element={<ArticleDetailPage />} />
        <Route path="/review" element={<ArticlePage />} />
        <Route path="/review/opinion" element={<OpinionPage />} />
        <Route path="/review/vignette" element={<VignettePage />} />
      </Routes>
    </BrowserRouter>
  )
}
