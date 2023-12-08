// PasswordPrompt.js
import React, {ChangeEvent, FormEvent} from 'react';
import Modal from 'react-modal';

type PasswordPromptProps = {
    isOpen: boolean;
    closePrompt: () => void;
    handleProtectedTypeSubmit: (e: FormEvent) => void;
    passwordInput: string;
    setPasswordInput: (value: string) => void;
};

const PasswordPrompt: React.FC<PasswordPromptProps> = ({ isOpen, closePrompt, handleProtectedTypeSubmit, passwordInput, setPasswordInput }) => {
    return (
        <Modal
            isOpen={isOpen}
            onRequestClose={closePrompt}
            className="modal-chantype-psswd"
            overlayClassName="overlay-chantype-psswd"
        >
            <div className="chantype-psswd">
                <div className="title-chantype-psswd">
                    <h2>Enter Password</h2>
                </div>
                <div className="form-chantype-psswd">
                    <form onSubmit={handleProtectedTypeSubmit}>
                        <input
                            type="password"
                            value={passwordInput}
                            onChange={(e: ChangeEvent<HTMLInputElement>) => setPasswordInput(e.target.value)}
                            required
                        />
                        <button className="chantype-word-btn" type="submit">
                            Confirm
                        </button>
                    </form>
                </div>
                <div className="close-type-protected">
                    <button className="chantype-word-btn" onClick={closePrompt}> Close</button>
                </div>
            </div>
        </Modal>
    )
}

export default PasswordPrompt;
