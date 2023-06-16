import React from "react";
import {Route, Routes, Navigate, useNavigate, useLocation} from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import Main from "./Main";
import api from "../utils/Api";
import PopupWithForm from "./PopupWithForm";
import EditProfilePopup from "./EditProfilePopup";
import EditAvatarPopup from "./EditAvatarPopup";
import AddPlacePopup from "./AddPlacePopup";
import ImagePopup from "./ImagePopup";
import CurrentUserContext from "../contexts/CurrentUserContext";
import Register from "./Register";
import Login from "./Login";
import NotFound from "./NotFound";
import InfoTooltip from "./InfoTooltip";
import ProtectedRoute from "./ProtectedRoute";
import * as auth from "../utils/Auth";

function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loggedIn, setLoggedIn] = React.useState(false);
  const [userEmail, setUserEmail] = React.useState("");

  const [currentRoute, setCurrentRoute] = React.useState("");
  
  const [currentUser, setCurrentUser] = React.useState({});
  const [cards, setCards] = React.useState([]);

  const [isEditProfilePopupOpen, setIsEditProfilePopupOpen] = React.useState(false);
  const [isAddPlacePopupOpen, setIsAddPlacePopupOpen] = React.useState(false);
  const [isEditAvatarPopupOpen, setIsEditAvatarPopupOpen] = React.useState(false);
  const [selectedCard, setSelectedCard] = React.useState({});

  const [showInfoToolTip, setShowInfoToolTip] = React.useState(false);
  const [result, setResult] = React.useState(false);

  const textInfoTooltip = result
    ? "Вы успешно зарегистрировались!"
    : "Что-то пошло не так! Попробуйте еще раз.";


  const handleLogin = ({ email }) => {
      setLoggedIn(true);
      setUserEmail(email);
  };

  React.useEffect(() => {
    tockenCheck();
  }, []);

  function getUserData() {
    api
      .getUserInfo()
      .then((userData) => {
        setCurrentUser(userData);
      })
      .catch((err) => {
        console.error(`Ошибка: ${err}`);
      });
  }

  function getCards() {
    api
      .getArrCards()
      .then((cardsData) => {
        setCards(cardsData);
      })
      .catch((err) => {
        console.error(`Ошибка: ${err}`);
      });
  }

  function handleCardLike(card) {
    const isLiked = card.likes.some((i) => i._id === currentUser._id);
    if (!isLiked) {
      api
        .putLike(card._id)
        .then((newCard) => {
          setCards((state) =>
            state.map((c) => (c._id === card._id ? newCard : c))
          );
        })
        .catch((err) => {
          console.error(`Ошибка: ${err}`);
        });
    } else {
      api
        .deleteLike(card._id)
        .then((newCard) => {
          setCards((state) =>
            state.map((c) => (c._id === card._id ? newCard : c))
          );
        })
        .catch((err) => {
          console.error(`Ошибка: ${err}`);
        });
    }
  }

  function handleCardDelete(card) {
    api
      .deleteCard(card._id)
      .then(() => {
        setCards((state) => state.filter((c) => c._id !== card._id));
      })
      .catch((err) => {
        console.error(`Ошибка: ${err}`);
      });
  }

  function handleEditProfileClick() {
    setIsEditProfilePopupOpen(true);
  }

  function handleUpdateUser(userData) {
    api
      .patchUserInfo(userData)
      .then((userData) => {
        setCurrentUser(userData);
        closeAllPopups();
      })
      .catch((err) => {
        console.err(`Ошибка: ${err}`);
      });
  }

  function handleEditAvatarClick() {
    setIsEditAvatarPopupOpen(true);
  }

  function handleUpdateAvatar(avatar) {
    console.log(avatar);
    api
      .patchAvatar(avatar)
      .then((avatar) => {
        setCurrentUser(avatar);
        closeAllPopups();
      })
      .catch((err) => {
        console.error(`Ошибка: ${err}`);
      });
  }

  function handleAddPlaceClick() {
    setIsAddPlacePopupOpen(true);
  }

  function handleAddPlaceSubmit(place) {
    api
      .postUserCard(place)
      .then((newCard) => {
        setCards([newCard, ...cards]);
        closeAllPopups();
      })
      .catch((err) => {
        console.error(`Ошибка: ${err}`);
      });
  }

  function handleCardClick(card) {
    setSelectedCard(card);
  }

  function closeAllPopups() {
    setIsEditProfilePopupOpen(false);
    setIsAddPlacePopupOpen(false);
    setIsEditAvatarPopupOpen(false);
    setSelectedCard({});
    setShowInfoToolTip(false);
  }

  function handleRegister(data) {
    const { email, password } = data;
    auth
      .register(email, password)
      .then(() => {
        setResult(true);
        setShowInfoToolTip(true);
        navigate("/sign-up", {
          replace: true
        });
      })
      .catch((err) => {
        console.error(`Ошибка: ${err}`);
        setResult(false);
        setShowInfoToolTip(true);
      });
  }

  function handleAutorization(data) {
    const { email, password } = data;
    const dataAuthUser = {
      email: email,
      password: password
    };
    auth
      .authorize(email, password)
      .then((data) => {
        if (data.token) {
          localStorage.setItem("jwt", data.token);
          getCards();
          handleLogin(dataAuthUser);
          tockenCheck();
        }
      })
      .catch((err) => {
        console.error(`Ошибка: ${err}`);
      });
  }

  function tockenCheck() {
    const jwt = localStorage.getItem("jwt");

    if (jwt) {
      auth
        .checkToken(jwt)
        .then((user) => {
          setLoggedIn(true);
          getUserData();
          getCards();
          handleLogin(user.data);

          const path = location.pathname;
          switch (path) {
            case "/":
              navigate("/");
              break;
            case "/sign-in":
              navigate("/");
              break;
            case "/sign-up":
              navigate("/");
              break;
          }
        })
        .catch((err) => {
          console.error(`Ошибка: ${err}`);
        });
    } else {
      setLoggedIn(false);
    }
  }

  function handleExitProfile() {
    if (localStorage.getItem("jwt")) {
      localStorage.removeItem("jwt");
      navigate("/sign-in");
      setLoggedIn(false);
    }
  }

  return (
    <CurrentUserContext.Provider value={currentUser}>
      <div className="page">
        <Header
          email={userEmail}
          loggedIn={loggedIn}
          currentRoute={currentRoute}
          handleExitProfile={handleExitProfile}
        />
        <Routes>
          <Route
            exact
            path="/"
            element={
              !loggedIn ? (
                <Navigate to="/sign-up" />
              ) : (
                <ProtectedRoute
                  onEditProfile={handleEditProfileClick}
                  onAddPlace={handleAddPlaceClick}
                  onEditAvatar={handleEditAvatarClick}
                  onCardClick={handleCardClick}
                  cards={cards}
                  onCardLike={handleCardLike}
                  onCardDelete={handleCardDelete}
                  loggedIn={loggedIn}
                  setCurrentRoute={setCurrentRoute}
                  element={Main}
                />
              )
            }
            replace
          />

          <Route
            exact
            path="/sign-up"
            element={
              <Register
                handleDataForm={handleRegister}
                setCurrentRoute={setCurrentRoute}
              />
            }
          />
          <Route
            exact
            path="/sign-in"
            element={
              <Login
                handleDataForm={handleAutorization}
                setCurrentRoute={setCurrentRoute}
              />
            }
          />
          <Route path="*" element={<NotFound />} replace />
        </Routes>

        {loggedIn && <Footer />}

        <InfoTooltip
          isOpen={showInfoToolTip}
          onClose={closeAllPopups}
          res={result}
          text={textInfoTooltip}
        />

        <EditProfilePopup
          isOpen={isEditProfilePopupOpen}
          onClose={closeAllPopups}
          onUpdateUser={handleUpdateUser}
        />

        <EditAvatarPopup
          isOpen={isEditAvatarPopupOpen}
          onClose={closeAllPopups}
          onUpdateAvatar={handleUpdateAvatar}
        />

        <AddPlacePopup
          isOpen={isAddPlacePopupOpen}
          onClose={closeAllPopups}
          onAddPlace={handleAddPlaceSubmit}
        />

        <PopupWithForm name="delete-card" title="Вы уверены?" btnText="Да" />

        <ImagePopup card={selectedCard} onClose={closeAllPopups} />
      </div>
    </CurrentUserContext.Provider>
  );
}

export default App;