<script>
	import '$lib/styles/privacy.css';
</script>

<section class="page-wrap">
	<div class="card">
		<h1 class="card-title">Privacy and Data Usage</h1>
		
		<p class="intro">
			This application is a student project for learning full-stack development. Even though it is not a commercial product, I still treat your financial data as sensitive information. On this page I explain what data the app stores, how it is used, and what control you have over it.
		</p>

		<h2>What data does this app store?</h2>

		<h3>Account data</h3>
		<p>
			When you register, the app stores a username, your email address and a password hash. The original password is never stored in the database.
		</p>

		<h3>Financial data</h3>
		<p>
			For each transaction the app stores the amount, date, type (income or expense), category and a short description. These transactions are linked to your account so the app can show your personal overviews and charts.
		</p>

		<h3>Technical data</h3>
		<p>
			The server may temporarily store technical information such as timestamps and error messages to help me debug problems. I try to avoid logging any sensitive values inside these messages.
		</p>

		<h2>What data does this app not store?</h2>

		<p>
			The app is designed with data minimisation in mind. That means it only stores what is needed for the budgeting functionality.
		</p>

		<p>The app does <strong>not</strong> store:</p>
		<ul>
			<li>Bank account numbers or credit card numbers</li>
			<li>National ID numbers or home addresses</li>
			<li>Uploaded files or documents</li>
			<li>Your real-world identity, except for the username and email you choose</li>
		</ul>

		<h2>How is your data used?</h2>

		<p>Your data is only used to provide the features of the Personal Finance Tracker:</p>
		<ul>
			<li>calculate balances, summaries and charts</li>
			<li>filter and group your transactions</li>
			<li>remember your categories and settings</li>
		</ul>

		<p>
			Your data is not sold, shared with third parties or used for advertising. The project only exists for educational purposes.
		</p>

		<h2>How is your data protected?</h2>

		<ul>
			<li>Passwords are stored as hashes, not as plain text, which means they cannot be read directly from the database.</li>
			<li>Access to the API is protected by an authentication mechanism, so only logged-in users can reach their own data.</li>
			<li>The back end and front end run as separate services, which makes it easier to secure and deploy them.</li>
			<li>I avoid logging secrets or full tokens in the server logs.</li>
		</ul>

		<p>
			If I deploy this app publicly in the future, one of my next steps is to run it over HTTPS so that data is encrypted while it is sent between your browser and the server.
		</p>

		<h2>Your choices and control</h2>

		<p>You remain in control of your data inside this project:</p>
		<ul>
			<li>You can edit or delet	e individual transactions from your overviews.</li>
			<li>You can use the <strong>Delete all my transactions</strong> option on this page to clear your full transaction history.</li>
			<li>You can also use the <strong>Delete my account</strong> option to remove your account and all related data without needing to contact the developer. Note: this process is not reversible.</li>
		</ul>

		<p>
			These options are there so that you can always take your data back if you change your mind.
		</p>

		<h2>Intercultural and accessibility aspects</h2>

		<p>
			The app is used in an international context, but my main focus is on users in Europe. For that reason I chose euro (EUR) as the single currency in the application. Euro is one of the most recognised currencies worldwide and definitely the most familiar in Europe, which makes it a good balance between simplicity and recognisability.
		</p>

		<p>
			Category names and labels are kept neutral and in English, such as "Housing", "Food", "Transport" and "Leisure", so they make sense for students with different backgrounds. I also try to use clear icons, readable fonts and enough colour contrast so that the interface is accessible for as many users as possible.
		</p>

		<h2>Student project disclaimer</h2>

		<p class="disclaimer">
			This finance tracker is part of my Individual Project for Semester 3. It is not an official financial service and should not be used for managing large amounts of money. The goal is to learn how to build secure and maintainable software and to apply ethical and intercultural thinking in practice.
		</p>
	</div>
</section>
