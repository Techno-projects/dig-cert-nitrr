import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from 'axios';
import urls from '../urls.json';

const server = urls.SERVER_URL;

const GetCertificate = () => {
  const [certificate, setCertificate] = useState("");
  const searchParams = new URLSearchParams(window.location.search);
  const navigate = useNavigate();
  const serial = searchParams.get("serial");

  useEffect(() => {
    if (!serial) {
      navigate("/event_management")
    }
    getCertificate();
  }, [searchParams]);

  const getCertificate = async () => {
    const res = await axios.get(`${server}/api/get_certificate?serial=${serial}`);
    console.log(res.data);
    const certificateUrl = `/${res.data.certificate}`
    setCertificate(certificateUrl)
  }

  return (
    <>
      <h1>
        Verified Certificate
      </h1>
      <center>
        {certificate && <img height={500} src={certificate} />}
      </center>
    </>
  )
}

export default GetCertificate;