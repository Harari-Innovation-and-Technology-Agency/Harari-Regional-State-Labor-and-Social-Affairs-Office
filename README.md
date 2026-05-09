# Harari-Regional-State-Labor-and-Social-Affairs-Office
This repository contains the source code for the official website of the Harari Regional State Labor and Social Affairs Office. It is a static informational website designed to provide details about the office's mission, services, news, and staff, and includes a unique admin-side administrative panel for content management.


## ✨ Features

- **Public-Facing Website**: Static pages including Home, About Us, Services, News, Photo Gallery, Office Structure, and Contact Us.
- **Client-Side Admin Panel**: A browser-based CMS that allows for easy content updates without a backend server.
  - Manage news articles (create, edit, delete)
  - Update "About Us" page content (Mission, Vision, Values)
  - Add and delete photos in the gallery
  - Manage list of programs and services
  - Data stored locally in browser localStorage
  - Export content as JSON for backup or migration
- **Multi-language Ready**: Supports English, Amharic, and Afaan Oromoo using `data-i18n` attributes.
- **Third-Party Integrations**:
  - Formspree for handling contact form submissions
  - Tawk.to for live chat support

## 👥 Contributors

- Abel Melaku Buzye
- Daniel Taye Abera
- Edan Birhanu Kassa
- Hatamu Wolde Hadego

## 💻 Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Icons**: Font Awesome
- **External Services**: Formspree, Tawk.to

## 📂 Project Structure

```

/
├── index.html            # Main landing page
├── about.html
├── service.html
├── news.html
├── photogallary.html
├── office.html
├── address.html
├── admin-login.html      # Login page for the admin panel
├── admin.html            # The admin panel interface
├── style.css             # Main stylesheet
├── address.css           # Additional styles for the address page
├── script.js             # Main JavaScript file
└── image/                # Folder for all website images

```

## 🚀 Getting Started

This is a static website and does not require complex setup.

1. Clone the repository:
   ```bash
   git clone https://your-repository-url.git
   ```

````

2. Navigate to the project directory:

   ```bash
   cd your-project-directory
   ```
3. Open in Browser:

   * Open the `index.html` file in your web browser.

## 🛠 Admin Panel Usage

1. Access: Open `admin-login.html`
2. Login credentials:

   * Username: `admin`
   * Password: `admin`
3. After login, you are redirected to `admin.html` where you can manage news, pages, gallery, and services.

⚠ **Disclaimer**:

* All data is stored in browser localStorage.
* Content will not sync across computers.
* Clearing cache will erase all stored content.
* No backend is implemented. Intended for local use only.

## 🔮 Future Improvements

* Implement a backend (Node.js, Django/Flask, or PHP)
* Database integration (MongoDB, PostgreSQL, MySQL)
* Full translation library for multi-language support
* Secure authentication system

````
