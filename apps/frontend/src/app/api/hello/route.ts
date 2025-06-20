export async function GET(request: Request) {
  // app
  // get data from backend
  // return data
  //http://localhost:${port}/${globalPrefix}
  const response = await fetch('http://localhost:3001/api/hello');
  const data = await response.json();
  return Response.json(data);
}
