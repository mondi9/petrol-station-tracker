import React from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

function ReloadPrompt() {
    const {
        offlineReady: [offlineReady, setOfflineReady],
        needRefresh: [needRefresh, setNeedRefresh],
        updateServiceWorker,
    } = useRegisterSW({
        onRegistered(r) {
            // eslint-disable-next-line prefer-template
            console.log('SW Registered: ' + r)
        },
        onRegisterError(error) {
            console.log('SW registration error', error)
        },
    })

    const close = () => {
        setOfflineReady(false)
        setNeedRefresh(false)
    }

    return (
        <div className="ReloadPrompt-container">
            {(offlineReady || needRefresh) && (
                <div className="glass" style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    padding: '16px',
                    borderRadius: 'var(--radius-md)',
                    zIndex: 10000,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '8px',
                    maxWidth: '300px',
                    border: '1px solid var(--color-active)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.5)'
                }}>
                    <div style={{ marginBottom: '8px' }}>
                        {offlineReady
                            ? <span>App ready to work offline</span>
                            : <span>New content available, click on reload button to update.</span>
                        }
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {needRefresh && (
                            <button
                                className="btn btn-primary"
                                onClick={() => updateServiceWorker(true)}
                                style={{ flex: 1, padding: '8px' }}
                            >
                                Reload
                            </button>
                        )}
                        <button
                            className="btn"
                            onClick={close}
                            style={{ flex: 1, padding: '8px', background: 'transparent', border: '1px solid var(--glass-border)', color: 'white' }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default ReloadPrompt
