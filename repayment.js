// Set today's date as default for payment date
        document.querySelector('input[name="paymentDate"]').valueAsDate = new Date();

        // Copy bank details to clipboard
        function copyBankDetails() {
            const details = "IHECHUKWU ONYEDIKACHI | Opay | 8106915548";
            navigator.clipboard.writeText(details).then(() => {
                const btn = document.getElementById('copyBtn');
                const originalText = btn.textContent;
                btn.textContent = '✅ Copied!';
                btn.classList.add('copy-success');

                setTimeout(() => {
                    btn.textContent = originalText;
                    btn.classList.remove('copy-success');
                }, 2000);
            }).catch(() => {
                alert('Copy failed. Please copy manually:\n' + details);
            });
        }

        // Payment calculator
        function calculateRepayment() {
            const amount = parseFloat(document.getElementById('loanAmount').value) || 0;
            const months = parseInt(document.getElementById('loanMonths').value) || 0;

            if (amount > 0 && months > 0) {
                // 20% interest per month
                const total = amount * (1 + (0.20 * months));
                document.getElementById('totalAmount').textContent = `₦${total.toLocaleString()}`;
                document.getElementById('repaymentResult').style.display = 'block';
            } else {
                document.getElementById('repaymentResult').style.display = 'none';
            }
        }

        // Form validation and submission
        const form = document.getElementById('repaymentForm');
        const formMsg = document.getElementById('formMsg');
        const submitBtn = document.getElementById('submitBtn');

        function clearErrors() {
            document.querySelectorAll('.error').forEach(e => e.textContent = '');
        }

        function showError(field, message) {
            const errEl = document.getElementById('err-' + field);
            if (errEl) errEl.textContent = message;
        }

        function showMessage(message, type = 'info') {
            formMsg.textContent = message;
            formMsg.className = `form-msg ${type}`;
            formMsg.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            clearErrors();

            const formData = new FormData(form);
            const data = Object.fromEntries(formData.entries());
            let valid = true;

            // Validation
            if (!data.fullName.trim()) {
                showError('fullName', 'Please enter your full name');
                valid = false;
            }

            if (!data.email.trim()) {
                showError('email', 'Please enter your email address');
                valid = false;
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
                showError('email', 'Please enter a valid email address');
                valid = false;
            }

            if (!data.phone.trim()) {
                showError('phone', 'Please enter your phone number');
                valid = false;
            }

            if (!data.amount || data.amount < 1000) {
                showError('amount', 'Please enter a valid amount (minimum ₦1,000)');
                valid = false;
            }

            if (!data.paymentDate) {
                showError('paymentDate', 'Please select the payment date');
                valid = false;
            }

            if (!data.paymentMethod) {
                showError('paymentMethod', 'Please select your payment method');
                valid = false;
            }

            if (!valid) {
                showMessage('⚠️ Please fix the errors above', 'error');
                return;
            }

            // Submit form
            submitBtn.disabled = true;
            submitBtn.textContent = '⏳ Submitting...';
            form.classList.add('loading');
            showMessage('📤 Submitting your payment confirmation...', 'info');

            try {
                const response = await fetch(form.action, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Accept': 'application/json'
                    }
                });

                if (response.ok) {
                    showMessage('✅ Payment confirmation submitted successfully! We will verify and update your account shortly. You can now close this window.', 'success');
                    form.reset();
                    document.getElementById('repaymentResult').style.display = 'none';
                    document.querySelector('input[name="paymentDate"]').valueAsDate = new Date();
                } else {
                    throw new Error('Submission failed');
                }
            } catch (error) {
                console.error('Error:', error);
                showMessage('❌ Failed to submit. Please try again or contact support.', 'error');
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = '📧 Submit Payment Confirmation';
                form.classList.remove('loading');
            }
        });

        // Handle window close gracefully
        window.addEventListener('beforeunload', (e) => {
            if (form.querySelector('input[name="fullName"]').value.trim()) {
                e.preventDefault();
                e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
            }
        });