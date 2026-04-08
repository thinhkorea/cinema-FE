<template>
    <footer class="footer">
        <div class="container">
            <!-- Main Footer Content -->
            <div class="row mb-4">
                <div class="col-md-3 mb-4">
                    <h5 class="footer-title">Về CAJ</h5>
                    <ul class="footer-links">
                        <li><a href="#">Giới thiệu</a></li>
                        <li><a href="#">Tin tức</a></li>
                        <li><a href="#">Tuyển dụng</a></li>
                        <li><a href="#">Liên hệ</a></li>
                    </ul>
                </div>

                <div class="col-md-3 mb-4">
                    <h5 class="footer-title">Hỗ trợ</h5>
                    <ul class="footer-links">
                        <li><a href="#">FAQ</a></li>
                        <li><a href="#">Hướng dẫn</a></li>
                        <li><a href="#">Chính sách</a></li>
                        <li><a href="#">Điều khoản</a></li>
                    </ul>
                </div>

                <div class="col-md-3 mb-4">
                    <h5 class="footer-title">Liên hệ</h5>
                    <div class="contact-info">
                        <p><i class="bi bi-geo-alt"></i> Khu II, Đường 3/2, Cần Thơ</p>
                        <p><i class="bi bi-telephone"></i> 1900 6017</p>
                        <p><i class="bi bi-envelope"></i> info@cajcinema.vn</p>
                    </div>
                </div>

                <div class="col-md-3 mb-4">
                    <h5 class="footer-title">Kết nối</h5>
                    <div class="social-links">
                        <a href="#" class="social-link"><i class="bi bi-facebook"></i></a>
                        <a href="#" class="social-link"><i class="bi bi-instagram"></i></a>
                        <a href="#" class="social-link"><i class="bi bi-youtube"></i></a>
                        <a href="#" class="social-link"><i class="bi bi-tiktok"></i></a>
                    </div>
                </div>
            </div>

            <!-- Footer Bottom -->
            <div class="footer-bottom text-center pt-4">
                <p class="copyright">© 2025 CinemaAndJoy Vietnam. All rights reserved.</p>
            </div>
        </div>
    </footer>
</template>

<style scoped>
.footer {
    background: linear-gradient(180deg, #ffffff 0%, #fff7f3 100%);
    color: #555;
    padding: 3rem 0 2rem 0;
    margin-top: 4rem;
    border-top: 1px solid #e6e6e6;
}

.footer-title {
    color: #2f2f2f;
    font-weight: 600;
    font-size: 1.1rem;
    margin-bottom: 1.25rem;
}

.footer-links {
    list-style: none;
    padding: 0;
    margin: 0;
}

.footer-links li {
    margin-bottom: 0.5rem;
}

.footer-links a {
    color: #4f4f4f;
    text-decoration: none;
    font-size: 0.95rem;
    transition: color 0.3s ease;
}

.footer-links a:hover {
    color: #ff6b35;
}

.contact-info p {
    color: #4f4f4f;
    margin-bottom: 0.5rem;
    font-size: 0.95rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.contact-info i {
    color: #ff6b35;
    width: 16px;
}

.social-links {
    display: flex;
    gap: 0.75rem;
}

.social-link {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: #fff5f2;
    border-radius: 8px;
    color: #ff6b35;
    font-size: 1.2rem;
    text-decoration: none;
    transition: all 0.3s ease;
    border: 1px solid #ffd5c7;
}

.social-link:hover {
    background: #ff6b35;
    color: #fff;
    transform: translateY(-2px);
}

.footer-bottom {
    border-top: 1px solid #ececec;
    margin-top: 2rem;
}

.copyright {
    color: #7f7f7f;
    margin: 0;
    font-size: 0.85rem;
}

@media (max-width: 768px) {
    .footer {
        padding: 3rem 0 1.5rem 0;
    }

    .social-links {
        justify-content: flex-start;
    }
}

@media (max-width: 576px) {
    .social-links {
        justify-content: center;
    }
}
</style>
