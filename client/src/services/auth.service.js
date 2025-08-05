const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api/auth/';

const register = async (email, password, address) => {
    const response = await fetch(API_URL + 'register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, address }),
    });

    // Read the response body ONCE.
    const data = await response.json();

    // Check the 'ok' status AFTER reading the body.
    if (!response.ok) {
        throw new Error(data.message || 'Registration failed.');
    }

    return data;
};

const login = async (email, password) => {
    const response = await fetch(API_URL + 'login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
    });

    const data = await response.json();

    if (!response.ok) {
        throw new Error(data.message || 'Login failed.');
    }

    // Only if the request was successful, save the token.
    if (data.token) {
        localStorage.setItem('user', JSON.stringify(data));
    }

    return data;
};

const logout = () => {
    localStorage.removeItem('user');
};

const getCurrentUser = () => {
    try {
        const user = JSON.parse(localStorage.getItem('user'));
        return user && user.token ? user : null;
    } catch (error) {
        localStorage.removeItem('user');
        return null;
    }
};

const authService = {
    register,
    login,
    logout,
    getCurrentUser
};

export default authService;