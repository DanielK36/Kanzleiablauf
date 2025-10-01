'use client';

export default function AuthButtons() {
  return (
    <div className="flex items-center space-x-4">
      <button 
        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        onClick={() => {
          sessionStorage.setItem('clerk_sign_in', 'true');
          // Use Clerk's sign in URL
          window.location.href = '/sign-in';
        }}
      >
        Anmelden
      </button>
      <button 
        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium"
        onClick={() => {
          sessionStorage.setItem('clerk_sign_up', 'true');
          // Use Clerk's sign up URL
          window.location.href = '/sign-up';
        }}
      >
        Registrieren
      </button>
    </div>
  );
}
