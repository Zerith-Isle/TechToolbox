const bmiData = JSON.parse(localStorage.getItem('bmiHistory') || '[]');
        
        function calculateBMI() {
            const height = parseFloat(document.getElementById('height').value) / 100;
            const weight = parseFloat(document.getElementById('weight').value);
            
            if (!height || !weight) return;

            const bmi = weight / (height * height);
            const status = getHealthStatus(bmi);
            
            updateDisplay(bmi, status);
            saveRecord(bmi, status);
            updateHistory();
        }

        function getHealthStatus(bmi) {
            if (bmi < 18.5) return { text: '体重过轻', color: 'var(--warning-red)' };
            if (bmi < 24) return { text: '健康体重', color: 'var(--success-green)' };
            if (bmi < 28) return { text: '体重过重', color: 'var(--warning-red)' };
            return { text: '肥胖', color: 'var(--warning-red)' };
        }

        function updateDisplay(bmi, status) {
            document.getElementById('bmiValue').textContent = bmi.toFixed(1);
            document.getElementById('healthStatus').textContent = status.text;
            document.getElementById('healthStatus').style.color = status.color;
            
            const progress = Math.min(Math.max((bmi - 15) / (35 - 15) * 100, 0), 100);
            document.getElementById('bmiProgress').style.width = `${progress}%`;
        }

        function saveRecord(bmi, status) {
            bmiData.unshift({
                date: new Date().toLocaleString(),
                bmi: bmi.toFixed(1),
                status: status.text,
                color: status.color
            });
            
            if (bmiData.length > 10) bmiData.pop();
            
            localStorage.setItem('bmiHistory', JSON.stringify(bmiData));
        }

        function updateHistory() {
            const container = document.getElementById('bmiHistory');
            container.innerHTML = bmiData.map(item => `
                <div class="history-item" style="border-left-color: ${item.color}">
                    <div class="history-time">${item.date}</div>
                    <div class="history-content">
                        <span class="history-bmi" style="color: ${item.color}">BMI ${item.bmi}</span>
                        <span class="history-status">- ${item.status}</span>
                    </div>
                </div>
            `).join('');
        }

        function clearHistory() {
            if (confirm('确定要清除所有历史记录吗？')) {
                bmiData.length = 0;
                localStorage.removeItem('bmiHistory');
                updateHistory();
            }
        }

        updateHistory();