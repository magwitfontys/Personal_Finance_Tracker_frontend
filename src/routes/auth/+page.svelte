<script>
	import '$lib/styles/auth.css';
	import { onMount } from 'svelte';
	import { browser } from '$app/environment';
	import eye from '$lib/pictures/eye.png';
	import crossedEye from '$lib/pictures/crossed-eye.png';
	import chart from '$lib/pictures/chart.png';

	let mode = 'login';
	let successMessage = '';
	let successTimeout;

	let login = { username: '', password: '', show: false, busy: false, error: '', errorTimeout: null };
	let signup = {
		username: '',
		password: '',
		confirm: '',
		show: false,
		show2: false,
		busy: false,
		error: '',
		errorTimeout: null,
		ok: ''
	};

	onMount(() => {
		if (!browser) return;
		if (location.hash === '#register') mode = 'register';

		// Check for success message in URL params
		const params = new URLSearchParams(window.location.search);
		const msg = params.get('success');
		if (msg) {
			successMessage = decodeURIComponent(msg);
			setSuccessTimeout();
			// Clean up URL
			window.history.replaceState({}, document.title, window.location.pathname);
		}
	});

	function setSuccessTimeout() {
		if (successTimeout) clearTimeout(successTimeout);
		successTimeout = setTimeout(() => {
			successMessage = '';
		}, 5000);
	}

	function clearSuccessMessage() {
		if (successTimeout) clearTimeout(successTimeout);
		successMessage = '';
	}

	function setLoginErrorTimeout() {
		if (login.errorTimeout) clearTimeout(login.errorTimeout);
		login.errorTimeout = setTimeout(() => {
			login.error = '';
		}, 5000);
	}

	function clearLoginError() {
		if (login.errorTimeout) clearTimeout(login.errorTimeout);
		login.error = '';
	}

	function setSignupErrorTimeout() {
		if (signup.errorTimeout) clearTimeout(signup.errorTimeout);
		signup.errorTimeout = setTimeout(() => {
			signup.error = '';
		}, 5000);
	}

	function clearSignupError() {
		if (signup.errorTimeout) clearTimeout(signup.errorTimeout);
		signup.error = '';
	}

	async function postJSON(path, body) {
		try {
			const res = await fetch(`/api${path}`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(body)
			});
			const text = await res.text();
			let data = {};
			try {
				data = text ? JSON.parse(text) : {};
			} catch {
				data = { raw: text };
			}
			if (!res.ok) {
				const msg = data.message || data.error || `HTTP ${res.status}`;
				throw new Error(msg);
			}
			return data;
		} catch (e) {
			if (e instanceof TypeError && e.message === 'Failed to fetch') {
				throw new Error(
					'Failed to reach API via /api proxy. Is the backend on :8081 and Vite proxy set?'
				);
			}
			throw e;
		}
	}

	$: loginValid = login.username.trim().length >= 3 && login.password.length >= 3 && !login.busy;
	$: signupValid =
		signup.username.trim().length >= 3 &&
		signup.password.length >= 6 &&
		signup.password === signup.confirm &&
		!signup.busy;

	async function handleLogin(e) {
		e.preventDefault();
		if (!loginValid) return;
		login.error = '';
		login.busy = true;
		try {
			const data = await postJSON('/auth/login', {
				username: login.username,
				password: login.password
			});

			// Store token if provided, fallback to simple auth flag
			if (browser) {
			if (data.token) localStorage.setItem('token', data.token);
			if (data.success === true || data.token) {
				localStorage.setItem('auth', '1');
				localStorage.setItem('username', login.username);
				// Store userId if provided, otherwise use 1 as default
				const userId = data.userId || data.user_id || 1;
				localStorage.setItem('userId', userId.toString());
				// Clear password field
				login.password = '';
				// standard navigation to avoid goto() check
				window.location.href = '/dashboard';
				} else {
					login.error = 'Login failed.';
					setLoginErrorTimeout();
				}
			}
		} catch (err) {
			login.error = err.message;
			setLoginErrorTimeout();
		} finally {
			login.busy = false;
		}
	}

	async function handleSignup(e) {
		e.preventDefault();
		if (!signupValid) {
			signup.error = 'Please fix the fields.';
			setSignupErrorTimeout();
			return;
		}
		signup.error = '';
		signup.ok = '';
		signup.busy = true;
		try {
			await postJSON('/auth/register', { username: signup.username, password: signup.password });
			signup.ok = 'Account created. Log in now.';
			// Clear all fields
			signup.username = '';
			signup.password = '';
			signup.confirm = '';
			// Redirect to login with success message
			mode = 'login';
			successMessage = 'Account created successfully! Please log in.';
			setSuccessTimeout();
		} catch (err) {
			// Check for specific error messages and provide user-friendly responses
			if (err.message.toLowerCase().includes('username already exists') || err.message.toLowerCase().includes('unique constraint')) {
				signup.error = `The username "${signup.username}" is already taken. Please choose a different one.`;
			} else {
				signup.error = err.message;
			}
			setSignupErrorTimeout();
		} finally {
			signup.busy = false;
		}
	}
</script>

<div class="auth">
	<div class="wrap">
		<div class="card">
			<div class="logo">
				<img src={chart} alt="icon" width="25" height="25" />
			</div>
			<h1 class="title">Personal Finance Tracker</h1>
			<p class="tagline">Manage your finances with ease</p>

			<div class="tabs">
				<button
					class:active={mode === 'login'}
					on:click={() => (mode = 'login')}
					aria-pressed={mode === 'login'}
				>
					Login
				</button>
				<button
					class:active={mode === 'register'}
					on:click={() => (mode = 'register')}
					aria-pressed={mode === 'register'}
				>
					Register
				</button>
			</div>

			{#if mode === 'login'}
				<form on:submit|preventDefault={handleLogin} class="form">
					<label>
						<span>Username</span>
						<input
							name="username"
							autocomplete="username"
							placeholder="Enter your username"
							bind:value={login.username}
							required
						/>
					</label>

					<label class="password">
						<span>Password</span>
						<div class="pw-field">
							<input
								type={login.show ? 'text' : 'password'}
								name="password"
								autocomplete="current-password"
								placeholder="Enter your password"
								bind:value={login.password}
								required
							/>
							<button
								type="button"
								class="eye"
								aria-label={login.show ? 'Hide password' : 'Show password'}
								aria-pressed={login.show}
								on:click={() => (login.show = !login.show)}
							>
								<img
									src={login.show ? crossedEye : eye}
									alt={login.show ? 'Hide password' : 'Show password'}
									width="25"
									height="25"
								/>
							</button>
						</div>
					</label>

					{#if successMessage}
						<div class="alert alert-success">
							<span>{successMessage}</span>
							<button type="button" class="alert-close" on:click={clearSuccessMessage} aria-label="Close alert">
								✕
							</button>
						</div>
					{/if}

					{#if login.error}
						<div class="alert alert-error">
							<span>{login.error}</span>
							<button type="button" class="alert-close" on:click={clearLoginError} aria-label="Close alert">
								✕
							</button>
						</div>
					{/if}

					<button class="primary" disabled={login.busy}
						>{login.busy ? 'Logging in…' : 'Login'}</button
					>
				</form>
			{:else}
				<form on:submit|preventDefault={handleSignup} class="form">
					<label>
						<span>Username</span>
						<input
							name="username"
							autocomplete="username"
							placeholder="Choose a username"
							bind:value={signup.username}
							required
						/>
					</label>

					<label class="password">
						<span>Password</span>
						<div class="pw-field">
							<input
								type={signup.show ? 'text' : 'password'}
								name="password"
								autocomplete="new-password"
								placeholder="Create a password"
								bind:value={signup.password}
								minlength="6"
								required
							/>
							<button
								type="button"
								class="eye"
								aria-label={signup.show ? 'Hide password' : 'Show password'}
								aria-pressed={signup.show}
								on:click={() => (signup.show = !signup.show)}
							>
								<img
									src={signup.show ? crossedEye : eye}
									alt={signup.show ? 'Hide password' : 'Show password'}
									width="25"
									height="25"
								/>
							</button>
						</div>
					</label>

					<label class="password">
						<span>Confirm Password</span>
						<div class="pw-field">
							<input
								type={signup.show2 ? 'text' : 'password'}
								name="confirm"
								autocomplete="new-password"
								placeholder="Confirm your password"
								bind:value={signup.confirm}
								minlength="6"
								required
							/>
							<button
								type="button"
								class="eye"
								aria-label={signup.show2 ? 'Hide password' : 'Show password'}
								aria-pressed={signup.show2}
								on:click={() => (signup.show2 = !signup.show2)}
							>
								<img
									src={signup.show2 ? crossedEye : eye}
									alt={signup.show2 ? 'Hide password' : 'Show password'}
									width="25"
									height="25"
								/>
							</button>
						</div>
					</label>

					{#if signup.error}
						<div class="alert alert-error">
							<span>{signup.error}</span>
							<button type="button" class="alert-close" on:click={clearSignupError} aria-label="Close alert">
								✕
							</button>
						</div>
					{/if}

					<button class="primary" disabled={signup.busy}
						>{signup.busy ? 'Creating…' : 'Create Account'}</button
					>
				</form>
			{/if}
		</div>
	</div>
</div>
