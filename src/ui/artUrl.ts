/** public/ 폴더의 파일 주소. 하위 경로로 배포해도(base './') 같은 곳을 가리킨다. */
export const artUrl = (path: string): string => `${import.meta.env.BASE_URL}${path}`;
