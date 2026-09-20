import React from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Non-sensitive logging
    console.error('MAUSAM Error Boundary Caught:', error?.message);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const isHindi = localStorage.getItem('mausam_language') === 'hi';

      return (
        <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full p-6 bg-slate-800/90 border border-slate-700 rounded-2xl text-center space-y-4 shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-white">
              {isHindi ? 'MAUSAM लोड करते समय कुछ समस्या हुई।' : 'Something went wrong while loading MAUSAM.'}
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              {isHindi 
                ? 'एप्लिकेशन को पुनः लोड करने के लिए नीचे दिए गए बटन पर क्लिक करें।' 
                : 'Please reload the application to restore your personalized dashboard.'}
            </p>
            <button
              onClick={this.handleReload}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-2 mx-auto transition-colors shadow-md"
            >
              <RotateCw className="w-4 h-4" />
              <span>{isHindi ? 'पुनः लोड करें (Reload)' : 'Reload MAUSAM'}</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
