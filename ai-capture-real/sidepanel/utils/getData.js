export async function getData(url) {
  try {
    // GET 요청
    const response = await fetch('http://34.64.53.95:8080/' + url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json(); // 응답 데이터 처리
    console.log('응답 결과:', result);
    return result;
  } catch (error) {
    console.error('GET 요청 실패:', error);
  }
}
