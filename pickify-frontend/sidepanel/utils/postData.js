export async function postData(url, data) {
  try {
    const response = await fetch('https://34.64.53.95:8080' + url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json(); // 응답 데이터 처리
    console.log('요청 url', url, '응답 결과:', result);
    return result;
  } catch (error) {
    console.error('요청 url', url, 'POST 요청 실패:', error);
  }
}
