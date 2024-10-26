const baseUrl = import.meta.env.VITE_PUBLIC_API_URL as string;

const fetchData = async(url: string, method: string, body:any = null, headers:any = null)=>{
    const options: RequestInit = {
        method: method,
        headers:{
            'Content-Type': 'application/json',
            ...headers
        },
    };

    if(method !== 'GET' && method !== 'HEAD' && body){
        options.body = JSON.stringify(body);
    };

    const res = await fetch(`${baseUrl}${url}`, options);
    const resData = await res.json();

    return {status: res.status, data: resData};
};

export { fetchData };