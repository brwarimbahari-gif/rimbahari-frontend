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
import AdminLoginPage from './pages/admin/AdminLoginPage'
import AdminPage from './pages/AdminPage'
import AdminManajemenArtikel from './pages/admin/AdminManajemenArtikel'
import AdminDetailArtikel from './pages/admin/AdminDetailArtikel'
import AdminManajemenEtalase from './pages/admin/AdminManajemenEtalase'
import AdminDetailEtalase from './pages/admin/AdminDetailEtalase'
import AdminManajemenUser from './pages/admin/AdminManajemenUser'
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

        {/* ── Admin System ────────────────────────────────────── */}
        <Route path="/4Dm1n_d4Shb04Rd/" element={<AdminPage />} />
        <Route path="/4Dm1n_d4Shb04Rd/login" element={<AdminLoginPage />} />
        <Route path="/4Dm1n_d4Shb04Rd/articles" element={<AdminManajemenArtikel />} />
        <Route path="/4Dm1n_d4Shb04Rd/articles/new" element={<AdminDetailArtikel />} />
        <Route path="/4Dm1n_d4Shb04Rd/articles/:id/edit" element={<AdminDetailArtikel />} />
        <Route path="/4Dm1n_d4Shb04Rd/display" element={<AdminManajemenEtalase />} />
        <Route path="/4Dm1n_d4Shb04Rd/display/new" element={<AdminDetailEtalase />} />
        <Route path="/4Dm1n_d4Shb04Rd/display/:id/edit" element={<AdminDetailEtalase />} />
        <Route path="/4Dm1n_d4Shb04Rd/users" element={<AdminManajemenUser />} />
      </Routes>
    </BrowserRouter>
  )
}
